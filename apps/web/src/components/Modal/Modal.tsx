// Wrapper Modal basé sur react-aria-components.
//
// Exemple :
//   const [open, setOpen] = useState(false);
//   <Modal isOpen={open} onOpenChange={setOpen} title="Inviter le locataire">
//     <p>Un email sera envoyé à marie@example.com.</p>
//     <Button onPress={handleInvite}>Envoyer</Button>
//   </Modal>
//
// Comportement :
//   - Backdrop semi-transparent (click → fermeture)
//   - Touche ESC → fermeture
//   - Focus piégé dans la modal (géré par react-aria)
//   - Animation entrée/sortie : fade + scale 0.95 → 1, 200ms

import classNames from 'classnames';
import { Dialog, Heading, Modal as RACModal, ModalOverlay } from 'react-aria-components';

import styles from './Modal.module.scss';

import type { ModalProps } from './Modal.types';

export type { ModalProps, ModalSize } from './Modal.types';

const sizeClass = {
	sm: styles.sizeSm,
	md: styles.sizeMd,
	lg: styles.sizeLg,
};

export const Modal = ({
	isOpen,
	onOpenChange,
	title,
	children,
	size = 'md',
}: ModalProps) => (
	<ModalOverlay
		className={styles.overlay}
		isDismissable
		isOpen={isOpen}
		onOpenChange={onOpenChange}
	>
		<RACModal className={classNames(styles.modal, sizeClass[size])}>
			<Dialog className={styles.dialog}>
				<Heading className={styles.title} slot="title">
					{title}
				</Heading>
				{children}
			</Dialog>
		</RACModal>
	</ModalOverlay>
);
