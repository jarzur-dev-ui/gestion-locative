import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { useResetPassword } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './ResetPasswordPage.module.scss';

const MIN_PASSWORD_LENGTH = 8;

export const ResetPasswordPage = () => {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const resetMutation = useResetPassword();

	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	if (!token) {
		return <Navigate replace to="/login" />;
	}

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		setLocalError(null);
		if (password.length < MIN_PASSWORD_LENGTH) {
			setLocalError(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
			return;
		}
		if (password !== confirm) {
			setLocalError('Les deux mots de passe ne correspondent pas.');
			return;
		}
		resetMutation.mutate(
			{ token, password },
			{
				onSuccess: () => {
					// Aucune session ouverte : l'utilisateur doit se reconnecter.
					navigate('/login', { replace: true });
				},
			},
		);
	};

	const errorMessage = localError ?? (resetMutation.isError ? resetMutation.error.message : null);

	return (
		<div className={styles.container}>
			<form className={styles.card} onSubmit={onSubmit}>
				<h1 className={styles.title}>Réinitialiser votre mot de passe</h1>
				<p className={styles.subtitle}>
					Choisissez un nouveau mot de passe sécurisé (8 caractères minimum).
				</p>

				<TextField
					autoComplete="new-password"
					autoFocus
					label="Mot de passe"
					name="password"
					onChange={(e) => setPassword(e.target.value)}
					required
					type="password"
					value={password}
				/>
				<TextField
					autoComplete="new-password"
					label="Confirmer le mot de passe"
					name="confirm"
					onChange={(e) => setConfirm(e.target.value)}
					required
					type="password"
					value={confirm}
				/>

				{errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

				<Button disabled={resetMutation.isPending} type="submit">
					{resetMutation.isPending ? 'Réinitialisation…' : 'Réinitialiser mon mot de passe'}
				</Button>
			</form>
		</div>
	);
};
