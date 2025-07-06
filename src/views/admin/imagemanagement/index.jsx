import { useEffect, useState } from "react";
import NftCard from "components/image/NftCard";
import UploadButton from "components/button/UploadButton";

const ImageManagement = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/images/")
      .then((res) => res.json())
      .then((data) => {
        const validImages = data.filter(
          (img) => img.ImagePath && img.ImageName && img.Status
        );
        setImages(validImages);
      })
      .catch((error) => console.error("Error fetching images:", error));
  }, []);

  return (
    <div className="p-4">
      <UploadButton />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {images.map((img, index) => (
          <NftCard
            key={index}
            title={img.ImageName}
            author={new Date(img.CreatedAt).toLocaleDateString()}
            size="—"
            image={img.ImagePath}
            status={img.Status}
            createAt={img.CreatedAt}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageManagement;