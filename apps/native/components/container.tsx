import type React from "react";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

export const Container = ({
	children,
	edges,
}: {
	children: React.ReactNode;
	edges?: Edge[];
}) => {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={edges}>
			{children}
		</SafeAreaView>
	);
};
