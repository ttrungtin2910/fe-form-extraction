import { useState, useCallback } from 'react';
import api from '../../config/api';

/**
 * Custom hook for managing image analysis tasks with optimized polling
 */
export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);

  /**
   * Dispatch multiple image analysis tasks
   */
  const dispatchTasks = useCallback(async (images) => {
    const validImages = images.filter(img => 
      img.Status === 'Uploaded' || img.Status === 'Failed'
    );
    
    if (validImages.length === 0) {
      throw new Error('No valid images to analyze');
    }

    setIsAnalyzing(true);
    setProgress(0);
    
    const taskPromises = validImages.map(async (image) => {
      try {
        const response = await api.queue.extractForm({
          ImageName: image.ImageName,
          ImagePath: image.ImagePath,
          Size: image.Size,
          Status: image.Status,
          CreatedAt: image.CreatedAt,
          FolderPath: image.FolderPath,
        });
        return { ...response, imageName: image.ImageName };
      } catch (error) {
        console.error(`Failed to enqueue ${image.ImageName}:`, error);
        return { error: error.message, imageName: image.ImageName };
      }
    });

    // Wait for all tasks to be dispatched
    const results = await Promise.all(taskPromises);
    const successfulTasks = results.filter(r => r.task_id && !r.error);
    const failedTasks = results.filter(r => r.error);

    if (failedTasks.length > 0) {
      console.warn(`${failedTasks.length} tasks failed to enqueue:`, failedTasks);
    }

    return { successfulTasks, failedTasks, totalTasks: validImages.length };
  }, []);

  /**
   * Optimized parallel polling for task status
   */
  const pollTaskStatus = useCallback(async (taskIds, options = {}) => {
    const {
      maxAttempts = 300, // 5 minutes with 1s intervals
      interval = 1000,
      onProgress = () => {},
      onTaskComplete = () => {}
    } = options;

    const stateMap = new Map();
    let attempts = 0;
    let completedCount = 0;
    const totalTasks = taskIds.length;

    const poll = async () => {
      attempts++;
      
      // Get pending task IDs
      const pendingTaskIds = taskIds.filter(id => {
        const state = stateMap.get(id);
        return !(state === 'SUCCESS' || state === 'FAILURE');
      });

      if (pendingTaskIds.length === 0) {
        return true; // All done
      }

      try {
        // Parallel polling instead of sequential
        const statusPromises = pendingTaskIds.map(async (taskId) => {
          try {
            const status = await api.queue.taskStatus(taskId);
            return { taskId, status };
          } catch (error) {
            console.error(`Poll error for task ${taskId}:`, error);
            return { taskId, status: { state: 'FAILURE', error: error.message } };
          }
        });

        const statuses = await Promise.all(statusPromises);
        
        // Update state map and count completions
        statuses.forEach(({ taskId, status }) => {
          const previousState = stateMap.get(taskId);
          stateMap.set(taskId, status.state);
          
          // Check if task just completed
          if (previousState !== status.state && 
              (status.state === 'SUCCESS' || status.state === 'FAILURE')) {
            completedCount++;
            onTaskComplete(taskId, status);
          }
        });

        // Update progress
        setProgress(Math.round((completedCount / totalTasks) * 100));
        onProgress(completedCount, totalTasks);

        // Check completion conditions
        if (completedCount >= totalTasks) return true;
        if (attempts >= maxAttempts) return true;
        
        return false;
      } catch (error) {
        console.error('Polling error:', error);
        return attempts >= maxAttempts; // Stop on repeated errors
      }
    };

    // Polling loop
    while (true) {
      const done = await poll();
      if (done) break;
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // Return final states
    const finalStates = {};
    taskIds.forEach(id => {
      finalStates[id] = stateMap.get(id) || 'UNKNOWN';
    });

    return {
      completed: completedCount,
      total: totalTasks,
      states: finalStates,
      attempts
    };
  }, []);

  /**
   * Analyze multiple images with progress tracking
   */
  const analyzeImages = useCallback(async (images, options = {}) => {
    try {
      setIsAnalyzing(true);
      setProgress(0);
      setCurrentTask('Dispatching tasks...');

      // Dispatch all tasks
      const { successfulTasks, failedTasks, totalTasks } = await dispatchTasks(images);
      
      if (successfulTasks.length === 0) {
        throw new Error('No tasks were successfully dispatched');
      }

      setCurrentTask(`Analyzing ${successfulTasks.length} images...`);

      // Poll for completion
      const taskIds = successfulTasks.map(t => t.task_id);
      const result = await pollTaskStatus(taskIds, {
        ...options,
        onTaskComplete: (taskId, status) => {
          const task = successfulTasks.find(t => t.task_id === taskId);
          if (task && options.onImageComplete) {
            options.onImageComplete(task.imageName, status);
          }
        },
        onProgress: (completed, total) => {
          if (options.onProgress) {
            options.onProgress(completed, total);
          }
        }
      });

      setCurrentTask('Analysis completed');
      setProgress(100);

      return {
        successful: successfulTasks.length,
        failed: failedTasks.length + (totalTasks - result.completed),
        total: totalTasks,
        results: result.states
      };

    } catch (error) {
      console.error('Image analysis failed:', error);
      setCurrentTask(`Error: ${error.message}`);
      throw error;
    } finally {
      setIsAnalyzing(false);
      setCurrentTask(null);
    }
  }, [dispatchTasks, pollTaskStatus]);

  return {
    isAnalyzing,
    progress,
    currentTask,
    analyzeImages,
    dispatchTasks,
    pollTaskStatus
  };
};
