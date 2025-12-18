import FontAwesome from "@expo/vector-icons/FontAwesome";
import { forwardRef } from "react";
import { Pressable, type PressableProps } from "react-native";

export const HeaderButton = forwardRef<any, PressableProps>((props, ref) => {
	return (
		<Pressable ref={ref} {...props}>
			{({ pressed }) => (
				<FontAwesome
					name="info-circle"
					size={25}
					color="gray"
					style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
				/>
			)}
		</Pressable>
	);
});
