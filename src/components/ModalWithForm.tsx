import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import {Form} from "@heroui/form";
import {Input} from "@heroui/input";
import {translations} from "@/lib/translations";
import {Button} from "@heroui/button";
import React from "react";

export type ModalBodyProps = {
	title?: string;
	cancelButton?: boolean;
	confirmButton: boolean;
	children: React.ReactNode;
	onSubmit: any;
}


const ModalWithForm = (props: ModalBodyProps) => {
	const {isOpen, onOpen, onOpenChange} = useDisclosure();
	const {button} =translations

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
			<ModalContent>
				{(onClose) => (
					<Form onSubmit={props.onSubmit} className='flex flex-col gap-4 p-4'>
						<ModalHeader className="flex flex-col gap-1">{props.title ?? ''}</ModalHeader>
						<ModalBody>
							{props.children}
						</ModalBody>
						<ModalFooter>
							{props.cancelButton && (
                                <Button color="danger" variant="light" onPress={onClose}>
									{button.cancel}
                                </Button>
							)}
							<Button color="primary" type='submit'>
								{button.confirm}
							</Button>
						</ModalFooter>
					</Form>
				)}
			</ModalContent>
		</Modal>
	)
}

export default ModalWithForm;