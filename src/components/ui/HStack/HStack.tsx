import {Stack, StackProps} from "@/components/ui/Stack/Stack";

export interface HStackProps extends Omit<StackProps, 'direction'> {
}

export function HStack(props: HStackProps) {
	return <Stack direction="row" {...props} />;
}