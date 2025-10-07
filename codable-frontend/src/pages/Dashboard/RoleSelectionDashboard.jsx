import Navbar from "../../components/Navbar";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {FaUser} from "react-icons/fa";
import {GiTeacher} from "react-icons/gi";
import {BiCodeBlock} from "react-icons/bi";
import {useState} from 'react';
import colors from "../../config/colors";

function RoleSelectionDashboard() {
  const [selectedCard, setSelectedCard] = useState(null);

  const handleCardClick = (title) => {
    setSelectedCard(title === selectedCard ? null : title);
  }

  const cards = [
    {
      icon: <FaUser className="w-12 h-12"/>,
      title: "Student",
      description:
        "Start your learning path, solve coding challenges, track your progress, and explore new technologies with personalized recommendations.",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400"
    },
    {
      icon: <GiTeacher className="w-12 h-12"/>,
      title: "Mentor",
      description:
        "Guide aspiring developers, create engaging coding content, conduct code reviews, and share your valuable expertise with the community.",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400"
    },
    {
      icon: <BiCodeBlock className="w-12 h-12"/>,
      title: "Workspace",
      description:
        "Manage team projects efficiently, collaborate seamlessly on code, integrate development tools, and bring your innovative ideas to life.",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      iconBg: "bg-rose-500/20",
      iconColor: "text-rose-400"
    },
  ];

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <div className={`absolute inset-0 bg-gradient-to-b from-[${colors.backgroundGradient.from}] via-[${colors.backgroundGradient.via}] to-[${colors.backgroundGradient.to}] opacity-100`} />
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-[${colors.glowEffects.blue}] rounded-full filter blur-[128px] animate-pulse` }/>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-[${colors.glowEffects.purple}] rounded-full filter blur-[128px] animate-pulse` }/>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar title="Codable" profileImg="..." />

        <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl w-full text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Welcome To Codable
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Choose your role to get started and dive into your coding journey. We are excited to have you with us
            </p>

            <div className="scroll-container w-full overflow-x-auto pb-4 mt-4">
              <div className="flex flex-nowrap space-x-6 justify-center">
                {cards.map((card, index) => (
                  <Card
                    key={index}
                    icon={card.icon}
                    title={card.title}
                    description={card.description}
                    bgColor={card.bgColor}
                    borderColor={card.borderColor}
                    iconBg={card.iconBg}
                    iconColor={card.iconColor}
                    isSelected={selectedCard === card.title}
                    isBlurred = {selectedCard !== null && selectedCard !== card.title}
                    onClick={() => handleCardClick(card.title)}
                  />
                ))}
              </div>
            </div>

            <Button text="Get Started" onClick={() => alert("Get Started")} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default RoleSelectionDashboard;
