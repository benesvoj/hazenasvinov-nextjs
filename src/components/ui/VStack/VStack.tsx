import {Stack, StackProps} from "@/components/ui/Stack/Stack";

export interface VStackProps extends Omit<StackProps, 'direction'> {
}

export function VStack(props: VStackProps) {
	return <Stack direction="column" {...props} />;
}

VStack.displayName = 'VStack';