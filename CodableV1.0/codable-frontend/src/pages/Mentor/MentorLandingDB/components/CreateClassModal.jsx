import { useState } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { request } from "../../../../services/apiClient.js";
import { useAuth } from "../../../../context/AuthContext.jsx";

export default function CreateClassModal({ isOpen, onClose, onClassCreated }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createdClass, setCreatedClass] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    className: "",
    description: "",
    category: "Core Java",
    // Step 2
    maxStudents: "",
    startDate: "",
    endDate: "",
    autoApproveStudents: false,
    allowLateSubmissions: true,
  });

  const categoryOptions = ["Core Java", "Advanced Java", "Frameworks", "Algorithms", "Other"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = () => {
    if (!formData.className.trim()) {
      setError("Class name is required");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate token exists
      if (!user || !user.token) {
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      const payload = {
        className: formData.className.trim(),
        description: formData.description || "",
        category: formData.category,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents, 10) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        autoApproveStudents: formData.autoApproveStudents,
        allowLateSubmissions: formData.allowLateSubmissions,
      };

      console.log("Creating class with payload:", payload);
      console.log("User token:", user.token ? "Token exists" : "NO TOKEN!");
      console.log("User role:", user.role);

      const response = await request(
        "/api/classes",
        {
          method: "POST",
          body: payload,
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      console.log("Class creation response:", response);

      if (response.success) {
        setSuccessMessage("✓ Class created successfully!");
        setCreatedClass(response.data);
        
        // Notify parent component
        if (onClassCreated) {
          onClassCreated(response.data);
        }

        // Show success message, then close after 2 seconds
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      } else {
        setError(response.message || "Failed to create class");
      }
    } catch (err) {
      console.error("Error creating class:", err);
      console.error("Error status:", err.status);
      console.error("Error payload:", err.payload);
      
      // Extract message from different error formats
      let errorMessage = err.message || "Error creating class";
      if (err.payload && err.payload.message) {
        errorMessage = err.payload.message;
      }
      
      if (err.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.status === 403) {
        errorMessage = "You don't have permission to create classes. Only instructors can create classes.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      className: "",
      description: "",
      category: "Core Java",
      maxStudents: "",
      startDate: "",
      endDate: "",
      autoApproveStudents: false,
      allowLateSubmissions: true,
    });
    setStep(1);
    setError(null);
    setSuccessMessage(null);
    setCreatedClass(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl p-8 rounded-2xl bg-[#0A1428] border border-blue-500/30 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5 text-[#fdfdff]/60" />
        </button>

        {/* Success State */}
        {successMessage && createdClass && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#fdfdff] mb-2">
              Class Created Successfully! 🎉
            </h2>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-6">
              <p className="text-emerald-300 text-sm mb-3">
                Share this join code with your students:
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-2xl font-bold text-emerald-400 text-center p-3 bg-black/50 rounded-lg">
                  {createdClass.joinCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdClass.joinCode);
                  }}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form State */}
        {!successMessage && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#fdfdff] mb-2">
                Create New Class
              </h2>
              <p className="text-[#fdfdff]/60 text-sm">
                Step {step} of 2 • Fill in your class details
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    placeholder="e.g., Java Fundamentals"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your class, what students will learn..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Class Settings */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                      Max Students (Optional)
                    </label>
                    <input
                      type="number"
                      name="maxStudents"
                      value={formData.maxStudents}
                      onChange={handleInputChange}
                      placeholder="e.g., 50"
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff]/50 cursor-not-allowed"
                    >
                      <option>{formData.category}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#fdfdff] mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoApproveStudents"
                      checked={formData.autoApproveStudents}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-[#fdfdff]">
                      Auto-approve students
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowLateSubmissions"
                      checked={formData.allowLateSubmissions}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-[#fdfdff]">
                      Allow late submissions (default: enabled)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 flex gap-3">
              {step === 2 && (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-[#fdfdff] rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {step === 1 && (
                <>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-[#fdfdff] rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {step === 2 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Class"
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
