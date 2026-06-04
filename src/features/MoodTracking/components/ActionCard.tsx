import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ActionCardProps = {
  title: string;
  color: string;
  icon: ImageSourcePropType;
  textColor: string;
};


export const ActionCard = ({
  title,
  color,
  icon,
  textColor,
}: ActionCardProps): React.JSX.Element => {
  return (
    <TouchableOpacity
      className={`${color} w-[30%] aspect-square rounded-2xl items-center justify-center p-3`}
    >
      <View className="bg-white/40 p-2 rounded-xl mb-2">
        <Image source={icon} className="w-6 h-6" />
      </View>
      <Text className={`${textColor} text-sm font-semibold`}>{title}</Text>
    </TouchableOpacity>
  );
};