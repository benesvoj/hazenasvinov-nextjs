import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import {Button} from "@heroui/button";
import {translations} from "@/lib/translations";
import React from "react";

type Props = {
	children: React.ReactNode,
	modalTitle: string,
	modalDescription?: string,
	onOpenModal?: boolean,
}

export const CustomModal = (props: Props) => {
	const {children, modalTitle, modalDescription} = props;
	const {button} = translations;
	const {isOpen, onOpen, onOpenChange} = useDisclosure();

	if (props.onOpenModal) {
		onOpen();
	}

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} size='sm'>
			<ModalContent>
				<ModalHeader>{modalTitle}</ModalHeader>
				<ModalBody>
					{modalDescription &&
                        <p className={'text-xs'}>{modalDescription}</p>
					}
					{children}
				</ModalBody>
				<ModalFooter>
					<Button color={'secondary'}>{button.cancel}</Button>
					<Button type='submit' color={'primary'}>{button.save}</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}