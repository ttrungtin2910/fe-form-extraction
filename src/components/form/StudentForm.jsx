import React from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

const DisplayStudentForm = ({ data, isEditing = false, onDataChange }) => {
  const getSafe = (value) => (value !== undefined && value !== null ? value : "");
  
  // Get array of majors (nganh_xet_tuyen) from data
  const majors = Array.isArray(data.nganh_xet_tuyen) 
    ? data.nganh_xet_tuyen.filter(Boolean) 
    : [];

  const handleFieldChange = (field, value) => {
    if (isEditing && onDataChange) {
      onDataChange({
        ...data,
        [field]: value
      });
    }
  };

  const handleNestedFieldChange = (parentField, childField, value) => {
    if (isEditing && onDataChange) {
      onDataChange({
        ...data,
        [parentField]: {
          ...data[parentField],
          [childField]: value
        }
      });
    }
  };

  const handleMajorChange = (index, value) => {
    if (isEditing && onDataChange) {
      const newMajors = [...(data.nganh_xet_tuyen || [])];
      newMajors[index] = value;
      onDataChange({
        ...data,
        nganh_xet_tuyen: newMajors
      });
    }
  };

  // Editable Checkbox component
  const Checkbox = ({ checked, label, parentField, childField }) => (
    <label className={`flex items-center space-x-2 text-sm font-medium text-blue-700 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
      {isEditing ? (
        <input 
          type="checkbox"
          checked={checked || false}
          onChange={(e) => handleNestedFieldChange(parentField, childField, e.target.checked)}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      ) : (
        checked ? (
          <MdCheckBox className="text-blue-600 text-lg" />
        ) : (
          <MdCheckBoxOutlineBlank className="text-gray-400 text-lg" />
        )
      )}
      <span>{label}</span>
    </label>
  );

  return (
    <div className="w-full p-6 bg-white">
      {/* Row 1: Personal Information (4 columns) */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">Họ và tên:</label>
          <input 
            value={getSafe(data.ho_va_ten)} 
            onChange={(e) => handleFieldChange('ho_va_ten', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">CCCD:</label>
          <input 
            value={getSafe(data.cccd)} 
            onChange={(e) => handleFieldChange('cccd', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">Điện thoại:</label>
          <input 
            value={getSafe(data.dien_thoai)} 
            onChange={(e) => handleFieldChange('dien_thoai', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">Email:</label>
          <input 
            value={getSafe(data.email)} 
            onChange={(e) => handleFieldChange('email', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Row 2: Academic Information (4 columns) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">Trường THPT:</label>
          <input 
            value={getSafe(data.truong_thpt)} 
            onChange={(e) => handleFieldChange('truong_thpt', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">Lớp:</label>
          <input 
            value={getSafe(data.lop)} 
            onChange={(e) => handleFieldChange('lop', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">Tỉnh:</label>
          <input 
            value={getSafe(data.tinh)} 
            onChange={(e) => handleFieldChange('tinh', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">SĐT phụ huynh:</label>
          <input 
            value={getSafe(data.dien_thoai_phu_huynh)} 
            onChange={(e) => handleFieldChange('dien_thoai_phu_huynh', e.target.value)}
            readOnly={!isEditing}
            className={`w-full px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
              isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Section: Intended Majors */}
      <div className="mb-6 border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
        <h3 className="text-base font-bold text-blue-800 mb-3">
          Bạn dự định xét tuyển (các) ngành học nào?
        </h3>
        <div className="space-y-3">
          {[0, 1, 2].map(index => (
            <div key={index} className="flex items-center">
              <span className="text-sm font-semibold text-blue-700 mr-2 w-8">{index + 1}.</span>
              <input 
                value={majors[index] || ""} 
                onChange={(e) => handleMajorChange(index, e.target.value)}
                readOnly={!isEditing}
                className={`flex-1 px-3 py-2 border-b-2 border-blue-300 text-gray-900 focus:outline-none text-sm ${
                  isEditing ? 'bg-white cursor-text' : 'bg-yellow-50 cursor-default'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section: High School Subjects */}
      <div className="mb-6 border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
        <h3 className="text-base font-bold text-blue-800 mb-3">
          Bạn chọn môn học nào ở cấp THPT?
        </h3>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <Checkbox checked={data.mon_chon_cap_thpt?.["Ngu van"]} label="Ngữ văn" parentField="mon_chon_cap_thpt" childField="Ngu van" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Toan"]} label="Toán" parentField="mon_chon_cap_thpt" childField="Toan" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Lich su"]} label="Lịch sử" parentField="mon_chon_cap_thpt" childField="Lich su" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Hoa hoc"]} label="Hóa học" parentField="mon_chon_cap_thpt" childField="Hoa hoc" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Dia ly"]} label="Địa lý" parentField="mon_chon_cap_thpt" childField="Dia ly" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["GDKT & PL"]} label="GDKT & PL" parentField="mon_chon_cap_thpt" childField="GDKT & PL" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Vat ly"]} label="Vật lý" parentField="mon_chon_cap_thpt" childField="Vat ly" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Sinh hoc"]} label="Sinh học" parentField="mon_chon_cap_thpt" childField="Sinh hoc" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Tin hoc"]} label="Tin học" parentField="mon_chon_cap_thpt" childField="Tin hoc" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Cong nghe"]} label="Công nghệ" parentField="mon_chon_cap_thpt" childField="Cong nghe" />
          <Checkbox checked={data.mon_chon_cap_thpt?.["Ngoai ngu"]} label="Ngoại ngữ:" parentField="mon_chon_cap_thpt" childField="Ngoai ngu" />
        </div>
      </div>

      {/* Section: Graduation Exam Subjects */}
      <div className="mb-6 border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
        <h3 className="text-base font-bold text-blue-800 mb-3">
          Bạn dự kiến thi tốt nghiệp THPT môn nào?
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Checkbox checked={data.mon_thi_tot_nghiep?.["Ngu van"]} label="Môn Ngữ văn" parentField="mon_thi_tot_nghiep" childField="Ngu van" />
            <Checkbox checked={data.mon_thi_tot_nghiep?.["Toan"]} label="Môn Toán" parentField="mon_thi_tot_nghiep" childField="Toan" />
            <Checkbox checked={data.mon_thi_tot_nghiep?.["Ngoai ngu"]} label="Môn Ngoại ngữ" parentField="mon_thi_tot_nghiep" childField="Ngoai ngu" />
          </div>
          <div className="space-y-3">
            <Checkbox checked={data.mon_thi_tot_nghiep?.["Khoa hoc tu nhien"]} label="Khoa học tự nhiên" parentField="mon_thi_tot_nghiep" childField="Khoa hoc tu nhien" />
            <Checkbox checked={data.mon_thi_tot_nghiep?.["Khoa hoc xa hoi"]} label="Khoa học xã hội" parentField="mon_thi_tot_nghiep" childField="Khoa hoc xa hoi" />
          </div>
        </div>
      </div>

      {/* Section: Application Methods */}
      <div className="mb-6 border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
        <h3 className="text-base font-bold text-blue-800 mb-3">
          Bạn chọn phương thức xét tuyển nào?
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Checkbox checked={data.phuong_thuc_xet_tuyen?.["Xet diem thi THPT"]} label="Xét điểm thi THPT" parentField="phuong_thuc_xet_tuyen" childField="Xet diem thi THPT" />
            <Checkbox checked={data.phuong_thuc_xet_tuyen?.["Xet hoc ba"]} label="Xét học bạ" parentField="phuong_thuc_xet_tuyen" childField="Xet hoc ba" />
            <Checkbox checked={data.phuong_thuc_xet_tuyen?.["Xet diem thi V-SAT"]} label="Xét điểm thi V-SAT" parentField="phuong_thuc_xet_tuyen" childField="Xet diem thi V-SAT" />
          </div>
          <div className="space-y-3">
            <Checkbox checked={data.phuong_thuc_xet_tuyen?.["Xet tuyen thang"]} label="Xét tuyển thẳng" parentField="phuong_thuc_xet_tuyen" childField="Xet tuyen thang" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayStudentForm;

