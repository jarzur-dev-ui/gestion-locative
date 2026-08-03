import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/config/routes';

import { useResetPassword } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './ResetPasswordPage.module.scss';

const MIN_PASSWORD_LENGTH = 8;

export const ResetPasswordPage = () => {
	const { t } = useTranslation();
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const resetMutation = useResetPassword();

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
			setLocalError(t('auth.reset.passwordTooShort', { count: MIN_PASSWORD_LENGTH }));
			return;
		}
		if (password !== confirm) {
			setLocalError(t('auth.reset.passwordMismatch'));
			return;
		}
		resetMutation.mutate(
			{ token, password },
			{
				onSuccess: () => {
					// Aucune session ouverte : l'utilisateur doit se reconnecter.
					navigate(paths.login(), { replace: true });
				},
			},
		);
	};

	const errorMessage = localError ?? (resetMutation.isError ? resetMutation.error.message : null);

	return (
		<div className={styles.container}>
			<form className={styles.card} onSubmit={onSubmit}>
				<h1 className={styles.title}>{t('auth.reset.title')}</h1>
				<p className={styles.subtitle}>{t('auth.reset.subtitle')}</p>

				<TextField
					autoComplete="new-password"
					autoFocus
					label={t('auth.reset.password')}
					name="password"
					onChange={(e) => setPassword(e.target.value)}
					required
					type="password"
					value={password}
				/>
				<TextField
					autoComplete="new-password"
					label={t('auth.reset.confirmPassword')}
					name="confirm"
					onChange={(e) => setConfirm(e.target.value)}
					required
					type="password"
					value={confirm}
				/>

				{errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

				<Button disabled={resetMutation.isPending} type="submit">
					{resetMutation.isPending ? t('auth.reset.submitting') : t('auth.reset.submit')}
				</Button>
			</form>
		</div>
	);
};
