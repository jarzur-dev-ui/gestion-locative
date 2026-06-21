import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { defaultRouteForRole, useAuth, useLogin } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './LoginPage.module.scss';

interface LocationState {
	from?: { pathname?: string };
}

export const LoginPage = () => {
	const { data: currentUser, isLoading } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const loginMutation = useLogin();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	// Déjà connecté → on redirige direct vers la home appropriée
	if (!isLoading && currentUser) {
		const state = location.state as LocationState | null;
		const target = state?.from?.pathname ?? defaultRouteForRole(currentUser.role);
		return <Navigate replace to={target} />;
	}

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		loginMutation.mutate(
			{ email: email.trim(), password },
			{
				onSuccess: (data) => {
					const state = location.state as LocationState | null;
					const target = state?.from?.pathname ?? defaultRouteForRole(data.user.role);
					navigate(target, { replace: true });
				},
			},
		);
	};

	return (
		<div className={styles.container}>
			<form className={styles.card} onSubmit={onSubmit}>
				<h1 className={styles.title}>Connexion</h1>
				<p className={styles.subtitle}>gestion-locative</p>

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
				<TextField
					autoComplete="current-password"
					label="Mot de passe"
					name="password"
					onChange={(e) => setPassword(e.target.value)}
					required
					type="password"
					value={password}
				/>

				{loginMutation.isError ? (
					<p className={styles.error}>{loginMutation.error.message}</p>
				) : null}

				<Button disabled={loginMutation.isPending} type="submit">
					{loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
				</Button>

				<p className={styles.forgotLink}>
					<Link to="/forgot-password">Mot de passe oublié ?</Link>
				</p>
			</form>
		</div>
	);
};
