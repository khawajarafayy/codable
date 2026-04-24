import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, UserPlus, Mail, Loader, AlertCircle } from "lucide-react";
import { request } from "../../../../services/apiClient";

export default function StudentApprovalModal({ classId, className, isOpen, onClose, onUpdate, userToken }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "add-student"

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
    }
  }, [isOpen, classId]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await request(`/api/instructor/class-requests/${classId}?status=pending`, {
        method: "GET",
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (response.success) {
        setPendingRequests(response.data || []);
      } else {
        setError(response.message || "Failed to fetch pending requests");
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setError(err.message || "Error loading pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, studentName) => {
    try {
      const response = await request(`/api/instructor/class-requests/${requestId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: {},
      });

      if (response.success) {
        setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
        setError(null);
        onUpdate?.();
      } else {
        setError(response.message || "Failed to approve request");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setError(err.message || "Error approving request");
    }
  };

  const handleRejectRequest = async (requestId, studentName) => {
    try {
      const response = await request(`/api/instructor/class-requests/${requestId}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: { notes: "Request rejected" },
      });

      if (response.success) {
        setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
        setError(null);
        onUpdate?.();
      } else {
        setError(response.message || "Failed to reject request");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError(err.message || "Error rejecting request");
    }
  };

  const handleAddStudentByEmail = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setAddingStudent(true);
      setError(null);

      const response = await request(`/api/classes/${classId}/add-student`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: { email: emailInput.toLowerCase().trim() },
      });

      if (response.success) {
        setEmailInput("");
        setActiveTab("pending");
        onUpdate?.();
        // Show success message
        setError(null);
      } else {
        setError(response.message || "Failed to add student");
      }
    } catch (err) {
      console.error("Error adding student:", err);
      setError(err.message || "Error adding student");
    } finally {
      setAddingStudent(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-blue-500/30 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20">
          <div>
            <h2 className="text-2xl font-bold text-[#fdfdff]">Manage Students</h2>
            <p className="text-sm text-[#fdfdff]/50">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-[#fdfdff]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-6 border-b border-blue-500/20">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-4 font-medium transition-all relative ${
              activeTab === "pending"
                ? "text-blue-400"
                : "text-[#fdfdff]/60 hover:text-[#fdfdff]/80"
            }`}
          >
            Pending Approvals
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-500/30 text-blue-300">
                {pendingRequests.length}
              </span>
            )}
            {activeTab === "pending" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("add-student")}
            className={`pb-3 px-4 font-medium transition-all relative ${
              activeTab === "add-student"
                ? "text-blue-400"
                : "text-[#fdfdff]/60 hover:text-[#fdfdff]/80"
            }`}
          >
            Add by Email
            {activeTab === "add-student" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "pending" && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-[#fdfdff]/60">No pending approvals</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between hover:bg-blue-500/15 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#fdfdff]">{request.studentName}</h3>
                      <p className="text-sm text-[#fdfdff]/60">{request.studentEmail}</p>
                      <p className="text-xs text-[#fdfdff]/50 mt-1">
                        Requested on: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveRequest(request.id, request.studentName)}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id, request.studentName)}
                        className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "add-student" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#fdfdff] mb-2">Add Student by Email</h3>
                <p className="text-sm text-[#fdfdff]/60 mb-4">
                  Enter a student's email address to add them directly to this class.
                </p>
              </div>

              <form onSubmit={handleAddStudentByEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Student Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-blue-500/30 text-[#fdfdff] placeholder-[#fdfdff]/40 focus:outline-none focus:border-blue-400 transition-colors"
                    disabled={addingStudent}
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingStudent || !emailInput.trim()}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {addingStudent ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Student
                    </>
                  )}
                </button>
              </form>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-[#fdfdff]/80">
                  💡 <strong>Tip:</strong> The student must be registered in the system with this email address.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
