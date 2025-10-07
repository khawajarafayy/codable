import PropTypes from "prop-types";

function Card({ icon, title, description, onClick, bgColor, borderColor, iconBg, iconColor, isSelected, isBlurred}) {
  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-80 ${bgColor} backdrop-blur-sm p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border ${borderColor} cursor-pointer hover:scale-95
      ${isSelected} ? 'scale-95 shadow-lg : 'hover:scale-95'}
      ${isBlurred ? 'opacity-50 blur-[1px]' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`${iconBg} p-6 rounded-full mb-6`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-3">
          {title}
        </h3>
        <p className="text-slate-300 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

Card.propTypes = {
  icon: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  bgColor: PropTypes.string,
  borderColor: PropTypes.string,
  iconBg: PropTypes.string,
  iconColor: PropTypes.string,
  isSelected: PropTypes.bool,
  isBlurred: PropTypes.bool
};


export default Card;
