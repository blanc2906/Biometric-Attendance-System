import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spin } from "antd";
import { Column } from "@ant-design/charts";
import { getUsers, User } from "../../../services/api";

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  // Attendance by User Chart
  const userAttendanceConfig = {
    data: users.map((user) => ({
      name: user.name,
      attendance: user.userlog.length,
    })),
    xField: "name",
    yField: "attendance",
    label: {
      position: "middle",
      style: {
        fill: "#FFFFFF",
      },
    },
  };

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Attendance by User">
              <Column {...userAttendanceConfig} />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}
