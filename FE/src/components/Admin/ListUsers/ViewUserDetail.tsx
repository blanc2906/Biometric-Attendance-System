import React from "react";
import { User } from "../../../services/api"; // Import User interface từ nơi bạn định nghĩa
import { Descriptions, Drawer } from "antd";
import type { DescriptionsProps } from "antd";

interface ViewUserDetailType {
  openViewDetail: boolean;
  setOpenViewDetail: React.Dispatch<React.SetStateAction<boolean>>;
  dataViewDetail: User | null; // Sử dụng kiểu User thay vì DataType
  setDataViewDetail: React.Dispatch<React.SetStateAction<User | null>>; // Cập nhật kiểu cho setDataViewDetail
}

export default function ViewUserDetail({
  openViewDetail,
  setOpenViewDetail,
  dataViewDetail,
  setDataViewDetail,
}: ViewUserDetailType) {
  const items: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "ID",
      children: <>{dataViewDetail?._id}</>, // Sử dụng _id từ User interface
    },
    {
      key: "2",
      label: "Employee ID",
      children: <>{dataViewDetail?.id_nvien}</>, // Sử dụng id_nvien từ User interface
    },
    {
      key: "3",
      label: "Full Name",
      children: <>{dataViewDetail?.name}</>, // Sử dụng name từ User interface
    },
    {
      key: "4",
      label: "Finger ID",
      children: <>{dataViewDetail?.finger_id}</>, // Sử dụng finger_id từ User interface
    },
    {
      key: "5",
      label: "User Log",
      children: <>{dataViewDetail?.userlog.join(", ")}</>, // Hiển thị userlog (có thể hiển thị một cách khác tùy theo yêu cầu)
      span: 3,
    },
    {
      key: "6",
      label: "Face Descriptor",
      children: <>{dataViewDetail?.faceDescriptor}</>, // Sử dụng faceDescriptor từ User interface
    },
    {
      key: "7",
      label: "Version",
      children: <>{dataViewDetail?.__v}</>, // Sử dụng __v từ User interface
    },
  ];

  const onClose = () => {
    setOpenViewDetail(false);
    setDataViewDetail(null);
  };

  return (
    <Drawer
      title="Specific information"
      onClose={onClose}
      open={openViewDetail}
      width="30vw"
    >
      <Descriptions title="User Info" bordered items={items} column={1} />
    </Drawer>
  );
}
