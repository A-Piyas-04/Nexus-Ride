import React from 'react';
import { useNavigate } from 'react-router-dom';
import UpdateLeaveModal from '../modals/update_leave';

export default function UpdateLeavePage() {
  const navigate = useNavigate();
  return (
    <UpdateLeaveModal
      open={true}
      onClose={() => navigate(-1)}
    />
  );
}
