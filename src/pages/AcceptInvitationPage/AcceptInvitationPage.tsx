import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/config/routes';

import { defaultRouteForRole, useAcceptInvitation } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './AcceptInvitationPage.module.scss';

const MIN_PASSWORD_LENGTH = 8;

export const AcceptInvitationPage = () => {
	const { t } = useTranslation();
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const acceptMutation = useAcceptInvitation();

	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	if (!token) {
		return <Navigate replace to={paths.login()} />;
	}

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		setLocalError(null);
		if (password.length < MIN_PASSWORD_LENGTH) {
			setLocalError(t('auth.acceptInvitation.passwordTooShort', { count: MIN_PASSWORD_LENGTH }));
			return;
		}
		if (password !== confirm) {
			setLocalError(t('auth.acceptInvitation.passwordMismatch'));
			return;
		}
		acceptMutation.mutate(
			{ token, password },
			{
				onSuccess: (data) => {
					navigate(defaultRouteForRole(data.user.role), { replace: true });
				},
			},
		);
	};

	const errorMessage = localError ?? (acceptMutation.isError ? acceptMutation.error.message : null);

	return (
		<div className={styles.container}>
			<form className={styles.card} onSubmit={onSubmit}>
				<h1 className={styles.title}>{t('auth.acceptInvitation.title')}</h1>
				<p className={styles.subtitle}>{t('auth.acceptInvitation.subtitle')}</p>

				<TextField
					autoComplete="new-password"
					autoFocus
					label={t('auth.acceptInvitation.password')}
					name="password"
					onChange={(e) => setPassword(e.target.value)}
					required
					type="password"
					value={password}
				/>
				<TextField
					autoComplete="new-password"
					label={t('auth.acceptInvitation.confirmPassword')}
					name="confirm"
					onChange={(e) => setConfirm(e.target.value)}
					required
					type="password"
					value={confirm}
				/>

				{errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

				<Button disabled={acceptMutation.isPending} type="submit">
					{acceptMutation.isPending
						? t('auth.acceptInvitation.submitting')
						: t('auth.acceptInvitation.submit')}
				</Button>
			</form>
		</div>
	);
};
