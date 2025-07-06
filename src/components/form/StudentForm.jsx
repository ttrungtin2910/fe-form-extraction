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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Full name</label>
          <input value={getSafe(data.ho_va_ten)} readOnly className="input" />
        </div>
        <div>
          <label className="block font-medium">Identify number</label>
          <input value={getSafe(data.cccd)} readOnly className="input" />
        </div>
        <div className="col-span-2">
          <label className="block font-medium">School</label>
          <input value={getSafe(data.truong_thpt)} readOnly className="input" />
        </div>
        <div>
          <label className="block font-medium">Class</label>
          <input value={getSafe(data.lop)} readOnly className="input" />
        </div>
        <div className="col-span-2">
          <label className="block font-medium">Major</label>
          <textarea
            value={(data.nganh_xet_tuyen || []).filter(Boolean).join("\n")}
            readOnly
            className="input h-24"
          />
        </div>
        <div>
          <label className="block font-medium">Personal phone number</label>
          <input value={getSafe(data.dien_thoai)} readOnly className="input" />
        </div>
        <div>
          <label className="block font-medium">Parent's phone number</label>
          <input value={getSafe(data.dien_thoai_phu_huynh)} readOnly className="input" />
        </div>
        <div>
          <label className="block font-medium">Province</label>
          <input value={getSafe(data.tinh)} readOnly className="input" />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input value={getSafe(data.email)} readOnly className="input" />
        </div>
      </div>

      <div className="mt-6">
        <label className="block font-medium mb-2">Subject</label>
        <div className="flex flex-wrap">
          {subjectCheckbox(data.mon_chon_cap_thpt)}
        </div>
      </div>

      <div className="mt-6">
        <label className="block font-medium mb-2">
          What subjects do you plan to take in your high school graduation exam?
        </label>
        <div className="flex flex-wrap items-center gap-4">
          {subjectCheckbox(data.mon_thi_tot_nghiep)}
          <div>
            <label className="block font-medium">First Option:</label>
            <input
              value={getSafe(data.mon_thi_tot_nghiep?.["Mon tu chon 1"])}
              readOnly
              className="input"
            />
          </div>
          <div>
            <label className="block font-medium">Second Option:</label>
            <input
              value={getSafe(data.mon_thi_tot_nghiep?.["Mon tu chon 2"])}
              readOnly
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block font-medium mb-2">How do you plan to apply to college?</label>
        <div className="flex flex-wrap">
          {subjectCheckbox(data.phuong_thuc_xet_tuyen)}
        </div>
      </div>
    </div>
  );
};

export default DisplayStudentForm;