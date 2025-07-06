import { useEffect, useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";

import DisplayStudentForm from "components/form/StudentForm";

// Empty form as fallback
const emptyForm = {
  ho_va_ten: "",
  cccd: "",
  truong_thpt: "",
  lop: "",
  nganh_xet_tuyen: ["", "", ""],
  dien_thoai: "",
  dien_thoai_phu_huynh: "",
  tinh: "",
  email: "",
  mon_chon_cap_thpt: {
    "Ngu van": false,
    "Toan": false,
    "Lich su": false,
    "Hoa hoc": false,
    "Dia ly": false,
    "GDKT & PL": false,
    "Vat ly": false,
    "Sinh hoc": false,
    "Tin hoc": false,
    "Cong nghe": false,
    "Ngoai ngu": false,
  },
  mon_thi_tot_nghiep: {
    "Ngu van": false,
    "Toan": false,
    "Mon tu chon 1": "",
    "Mon tu chon 2": "",
  },
  phuong_thuc_xet_tuyen: {
    "Xet diem hoc ba THPT": false,
    "Xet diem thi tot nghiep THPT": false,
    "Xet diem thi DGNL": false,
    "Xet diem thi V-SAT": false,
    "Xet tuyen thang": false,
  },
};

const ImageDialog = ({ open, title, image, onClose }) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const sendTitleToApi = async () => {
      try {
        if (!open || !title) return;

        const formData = new FormData();
        formData.append("title", title);

        const res = await fetch("http://localhost:8000/GetFormExtractInformation", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const result = await res.json();
        setFormData(result);
      } catch (err) {
        console.error("Error calling API:", err);
        setFormData(null);
      }
    };

    sendTitleToApi();
  }, [open, title]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
      onClick={onClose}
    >
      <div
        className="relative bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Exit icon in top-right */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition duration-200"
          aria-label="Close"
        >
          <IoIosCloseCircle className="text-3xl" />
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Image */}
          <div className="flex-1">
            <p className="text-center text-lg font-semibold text-gray-800 mb-4">
              {title}
            </p>
            <img
              src={image}
              alt="Preview"
              className="max-h-[80vh] mx-auto rounded-md"
            />
          </div>

          {/* Right: Form */}
          <div className="flex-1 overflow-y-auto max-h-[80vh]">
            <DisplayStudentForm data={formData || emptyForm} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDialog;