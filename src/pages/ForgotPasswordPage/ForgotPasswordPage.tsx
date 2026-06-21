import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { useRequestPasswordReset } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './ForgotPasswordPage.module.scss';

export const ForgotPasswordPage = () => {
	const requestMutation = useRequestPasswordReset();

	const [email, setEmail] = useState('');

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		requestMutation.mutate({ email: email.trim() });
	};

	if (requestMutation.isSuccess) {
		return (
			<div className={styles.container}>
				<div className={styles.card}>
					<h1 className={styles.title}>Mot de passe oublié</h1>
					<p className={styles.success}>
						Si un compte existe pour cette adresse, un email de réinitialisation vient
						d&apos;être envoyé. Vérifiez votre boîte de réception.
					</p>
					<p className={styles.backLink}>
						<Link to="/login">Retour à la connexion</Link>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<form className={styles.card} onSubmit={onSubmit}>
				<h1 className={styles.title}>Mot de passe oublié</h1>
				<p className={styles.subtitle}>
					Saisissez votre adresse email. Si un compte y est associé, vous recevrez un lien
					pour réinitialiser votre mot de passe.
				</p>

				<TextField
					autoComplete="email"
					autoFocus
					label="Email"
					name="email"
					onChange={(e) => setEmail(e.target.value)}
					required
					type="email"
					value={email}
				/>

				{requestMutation.isError ? (
					<p className={styles.error}>{requestMutation.error.message}</p>
				) : null}

				<Button disabled={requestMutation.isPending} type="submit">
					{requestMutation.isPending ? 'Envoi…' : 'Envoyer le lien'}
				</Button>

				<p className={styles.backLink}>
					<Link to="/login">Retour à la connexion</Link>
				</p>
			</form>
		</div>
	);
};
