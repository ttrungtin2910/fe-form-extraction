import React from "react";

const DisplayStudentForm = ({ data }) => {
  const getSafe = (value) => (value !== undefined && value !== null ? value : "");
  
  const subjectCheckbox = (subjectData = {}) =>
    Object.entries(subjectData).map(([subject, checked]) => (
      <label key={subject} className="mr-4 mb-2 inline-flex items-center">
        <input
          type="checkbox"
          checked={!!checked}
          readOnly
          className="mr-2 h-4 w-4"
        />
        {subject}
      </label>
    ));

  const majors = (data.nganh_xet_tuyen || []).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Student Information</h2>
        <p className="text-gray-600 mt-1">Extracted form data from image</p>
      </div>

      {/* Personal Information Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              value={getSafe(data.ho_va_ten)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number (CCCD)</label>
            <input 
              value={getSafe(data.cccd)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Phone</label>
            <input 
              value={getSafe(data.dien_thoai)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent's Phone</label>
            <input 
              value={getSafe(data.dien_thoai_phu_huynh)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              value={getSafe(data.email)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <input 
              value={getSafe(data.tinh)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Academic Information Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">High School</label>
            <input 
              value={getSafe(data.truong_thpt)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <input 
              value={getSafe(data.lop)} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none" 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Intended Majors</label>
          <textarea
            value={majors.length > 0 ? majors.join("\n") : "No majors selected"}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none h-20 resize-none"
            placeholder="No majors selected"
          />
        </div>
      </div>

      {/* High School Subjects Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          High School Subjects
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex flex-wrap gap-3">
            {subjectCheckbox(data.mon_chon_cap_thpt)}
          </div>
        </div>
      </div>

      {/* Graduation Exam Subjects Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
          Graduation Exam Subjects
        </h3>
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {subjectCheckbox(data.mon_thi_tot_nghiep)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Optional Subject</label>
              <input
                value={getSafe(data.mon_thi_tot_nghiep?.["Mon tu chon 1"])}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Second Optional Subject</label>
              <input
                value={getSafe(data.mon_thi_tot_nghiep?.["Mon tu chon 2"])}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Application Methods Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
          College Application Methods
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex flex-wrap gap-3">
            {subjectCheckbox(data.phuong_thuc_xet_tuyen)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayStudentForm;