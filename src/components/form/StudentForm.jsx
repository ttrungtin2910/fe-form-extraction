import React from "react";
import { motion } from "framer-motion";
import { CheckIcon as MdCheckBox } from "@heroicons/react/24/solid";

// Custom checkbox outline icon - square with rounded corners
const CheckboxOutlineIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="3"
      stroke="currentColor"
      fill="none"
    />
  </svg>
);

const DisplayStudentForm = ({ data, isEditing = false, onDataChange }) => {
  const getSafe = (value) =>
    value !== undefined && value !== null ? value : "";

  // Get array of majors (nganh_xet_tuyen) from data
  const majors = Array.isArray(data.nganh_xet_tuyen)
    ? data.nganh_xet_tuyen.filter(Boolean)
    : [];

  const handleFieldChange = (field, value) => {
    if (isEditing && onDataChange) {
      onDataChange({
        ...data,
        [field]: value,
      });
    }
  };

  const handleNestedFieldChange = (parentField, childField, value) => {
    if (isEditing && onDataChange) {
      onDataChange({
        ...data,
        [parentField]: {
          ...data[parentField],
          [childField]: value,
        },
      });
    }
  };

  const handleMajorChange = (index, value) => {
    if (isEditing && onDataChange) {
      const newMajors = [...(data.nganh_xet_tuyen || [])];
      newMajors[index] = value;
      onDataChange({
        ...data,
        nganh_xet_tuyen: newMajors,
      });
    }
  };

  // Editable Checkbox component
  const Checkbox = ({ checked, label, parentField, childField }) => (
    <motion.label
      className={`flex items-center space-x-2 text-sm font-medium text-gray-300 ${
        isEditing ? "cursor-pointer" : "cursor-default"
      }`}
      whileHover={isEditing ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {isEditing ? (
        <input
          type="checkbox"
          checked={checked || false}
          onChange={(e) =>
            handleNestedFieldChange(parentField, childField, e.target.checked)
          }
          className="h-5 w-5 rounded border-white/30 bg-white/10 text-white focus:ring-2 focus:ring-white/50"
        />
      ) : checked ? (
        <MdCheckBox className="h-5 w-5 text-white" />
      ) : (
        <CheckboxOutlineIcon className="h-5 w-5 text-gray-400" />
      )}
      <span className="text-white">{label}</span>
    </motion.label>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      className="w-full p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Row 1: Personal Information (2 columns - responsive) */}
      <motion.div
        className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        variants={itemVariants}
      >
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Họ và tên:
          </label>
          <motion.input
            value={getSafe(data.ho_va_ten)}
            onChange={(e) => handleFieldChange("ho_va_ten", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            CCCD:
          </label>
          <motion.input
            value={getSafe(data.cccd)}
            onChange={(e) => handleFieldChange("cccd", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Điện thoại:
          </label>
          <motion.input
            value={getSafe(data.dien_thoai)}
            onChange={(e) => handleFieldChange("dien_thoai", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Email:
          </label>
          <motion.input
            value={getSafe(data.email)}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
      </motion.div>

      {/* Row 2: Academic Information (2 columns - responsive) */}
      <motion.div
        className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        variants={itemVariants}
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Trường THPT:
          </label>
          <motion.input
            value={getSafe(data.truong_thpt)}
            onChange={(e) => handleFieldChange("truong_thpt", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Lớp:
          </label>
          <motion.input
            value={getSafe(data.lop)}
            onChange={(e) => handleFieldChange("lop", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Tỉnh:
          </label>
          <motion.input
            value={getSafe(data.tinh)}
            onChange={(e) => handleFieldChange("tinh", e.target.value)}
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            SĐT phụ huynh:
          </label>
          <motion.input
            value={getSafe(data.dien_thoai_phu_huynh)}
            onChange={(e) =>
              handleFieldChange("dien_thoai_phu_huynh", e.target.value)
            }
            readOnly={!isEditing}
            className={`w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
              isEditing
                ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                : "cursor-default bg-white/5 backdrop-blur-sm"
            }`}
            whileFocus={isEditing ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
      </motion.div>

      {/* Section: Intended Majors */}
      <motion.div
        variants={itemVariants}
        className="mb-6 rounded-2xl border border-white/20 bg-gray-800/60 p-5 shadow-lg backdrop-blur-sm"
      >
        <h3 className="mb-4 text-base font-bold text-white">
          Bạn dự định xét tuyển (các) ngành học nào?
        </h3>
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="flex items-center"
              whileHover={isEditing ? { x: 4 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="mr-3 w-8 flex-shrink-0 text-sm font-semibold text-gray-300">
                {index + 1}.
              </span>
              <motion.input
                value={majors[index] || ""}
                onChange={(e) => handleMajorChange(index, e.target.value)}
                readOnly={!isEditing}
                className={`min-w-0 flex-1 rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white transition-all focus:outline-none ${
                  isEditing
                    ? "cursor-text bg-white/10 backdrop-blur-sm focus:border-white/30 focus:ring-2 focus:ring-white/30"
                    : "cursor-default bg-white/5 backdrop-blur-sm"
                }`}
                whileFocus={isEditing ? { scale: 1.02 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Section: High School Subjects */}
      <motion.div
        variants={itemVariants}
        className="mb-6 rounded-2xl border border-white/20 bg-gray-800/60 p-5 shadow-lg backdrop-blur-sm"
      >
        <h3 className="mb-4 text-base font-bold text-white">
          Bạn chọn môn học nào ở cấp THPT?
        </h3>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Ngu van"]}
            label="Ngữ văn"
            parentField="mon_chon_cap_thpt"
            childField="Ngu van"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Toan"]}
            label="Toán"
            parentField="mon_chon_cap_thpt"
            childField="Toan"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Lich su"]}
            label="Lịch sử"
            parentField="mon_chon_cap_thpt"
            childField="Lich su"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Hoa hoc"]}
            label="Hóa học"
            parentField="mon_chon_cap_thpt"
            childField="Hoa hoc"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Dia ly"]}
            label="Địa lý"
            parentField="mon_chon_cap_thpt"
            childField="Dia ly"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["GDKT & PL"]}
            label="GDKT & PL"
            parentField="mon_chon_cap_thpt"
            childField="GDKT & PL"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Vat ly"]}
            label="Vật lý"
            parentField="mon_chon_cap_thpt"
            childField="Vat ly"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Sinh hoc"]}
            label="Sinh học"
            parentField="mon_chon_cap_thpt"
            childField="Sinh hoc"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Tin hoc"]}
            label="Tin học"
            parentField="mon_chon_cap_thpt"
            childField="Tin hoc"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Cong nghe"]}
            label="Công nghệ"
            parentField="mon_chon_cap_thpt"
            childField="Cong nghe"
          />
          <Checkbox
            checked={data.mon_chon_cap_thpt?.["Ngoai ngu"]}
            label="Ngoại ngữ:"
            parentField="mon_chon_cap_thpt"
            childField="Ngoai ngu"
          />
        </div>
      </motion.div>

      {/* Section: Graduation Exam Subjects */}
      <motion.div
        variants={itemVariants}
        className="mb-6 rounded-2xl border border-white/20 bg-gray-800/60 p-5 shadow-lg backdrop-blur-sm"
      >
        <h3 className="mb-4 text-base font-bold text-white">
          Bạn dự kiến thi tốt nghiệp THPT môn nào?
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Checkbox
              checked={data.mon_thi_tot_nghiep?.["Ngu van"]}
              label="Môn Ngữ văn"
              parentField="mon_thi_tot_nghiep"
              childField="Ngu van"
            />
            <Checkbox
              checked={data.mon_thi_tot_nghiep?.["Toan"]}
              label="Môn Toán"
              parentField="mon_thi_tot_nghiep"
              childField="Toan"
            />
            <Checkbox
              checked={data.mon_thi_tot_nghiep?.["Ngoai ngu"]}
              label="Môn Ngoại ngữ"
              parentField="mon_thi_tot_nghiep"
              childField="Ngoai ngu"
            />
          </div>
          <div className="space-y-3">
            <Checkbox
              checked={data.mon_thi_tot_nghiep?.["Khoa hoc tu nhien"]}
              label="Khoa học tự nhiên"
              parentField="mon_thi_tot_nghiep"
              childField="Khoa hoc tu nhien"
            />
            <Checkbox
              checked={data.mon_thi_tot_nghiep?.["Khoa hoc xa hoi"]}
              label="Khoa học xã hội"
              parentField="mon_thi_tot_nghiep"
              childField="Khoa hoc xa hoi"
            />
          </div>
        </div>
      </motion.div>

      {/* Section: Application Methods */}
      <motion.div
        variants={itemVariants}
        className="mb-6 rounded-2xl border border-white/20 bg-gray-800/60 p-5 shadow-lg backdrop-blur-sm"
      >
        <h3 className="mb-4 text-base font-bold text-white">
          Bạn chọn phương thức xét tuyển nào?
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Checkbox
              checked={data.phuong_thuc_xet_tuyen?.["Xet diem thi THPT"]}
              label="Xét điểm thi THPT"
              parentField="phuong_thuc_xet_tuyen"
              childField="Xet diem thi THPT"
            />
            <Checkbox
              checked={data.phuong_thuc_xet_tuyen?.["Xet hoc ba"]}
              label="Xét học bạ"
              parentField="phuong_thuc_xet_tuyen"
              childField="Xet hoc ba"
            />
            <Checkbox
              checked={data.phuong_thuc_xet_tuyen?.["Xet diem thi V-SAT"]}
              label="Xét điểm thi V-SAT"
              parentField="phuong_thuc_xet_tuyen"
              childField="Xet diem thi V-SAT"
            />
          </div>
          <div className="space-y-3">
            <Checkbox
              checked={data.phuong_thuc_xet_tuyen?.["Xet tuyen thang"]}
              label="Xét tuyển thẳng"
              parentField="phuong_thuc_xet_tuyen"
              childField="Xet tuyen thang"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DisplayStudentForm;
