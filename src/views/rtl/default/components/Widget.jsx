import Card from "components/card";
import { MdArrowDropUp, MdArrowDropDown } from "react-icons/md";

const Widget = ({ icon, title, subtitle, trend, trendColor = "green" }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    const isPositive = trend.startsWith('+');
    return isPositive ? <MdArrowDropUp className="h-4 w-4" /> : <MdArrowDropDown className="h-4 w-4" />;
  };

  const getTrendColorClass = () => {
    if (!trend) return "";
    const isPositive = trend.startsWith('+');
    return isPositive ? "text-green-500" : "text-red-500";
  };

  return (
    <Card extra="!flex-row flex-grow items-center rounded-[20px] hover:shadow-lg transition-all duration-300">
      <div className="mr-4 flex h-[90px] w-auto flex-row items-center">
        <div className="rounded-full bg-lightPrimary p-3 dark:bg-navy-700">
          <span className="flex items-center text-brand-500 dark:text-white">
            {icon}
          </span>
        </div>
      </div>

      <div className="h-50 mr-4 flex w-auto flex-col justify-center">
        <p className="font-dm text-sm font-medium text-gray-600">{title}</p>
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {subtitle}
        </h4>
        {trend && (
          <div className="flex items-center mt-1">
            {getTrendIcon()}
            <p className={`text-sm font-bold ${getTrendColorClass()}`}>
              {trend}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Widget;
