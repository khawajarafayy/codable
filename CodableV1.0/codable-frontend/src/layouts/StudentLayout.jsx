import StudentNavbar from '../components/StudentNavbar';

const StudentLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0A1428]">
      <StudentNavbar />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default StudentLayout;
