import PropTypes from "prop-types";

function Button({ text, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-8 py-3 my-8 
        bg-gradient-to-r from-blue-500 to-cyan-500 
        hover:from-blue-600 hover:to-cyan-600
        text-white font-semibold 
        rounded-full 
        transform transition-all duration-200 
        hover:scale-105 
        shadow-lg hover:shadow-cyan-500/25
        ${className}
      `}
    >
      {text}
    </button>
  );
}

Button.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default Button;
