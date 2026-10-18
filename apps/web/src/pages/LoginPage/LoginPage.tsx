import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/config/routes';

import { defaultRouteForRole, useAuth, useLogin } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './LoginPage.module.scss';

interface LocationState {
	from?: { pathname?: string };
}

export const LoginPage = () => {
	const { t } = useTranslation();
	const { data: currentUser, isLoading } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const loginMutation = useLogin();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	// Tant que la session se résout, on n'affiche pas le formulaire : sinon un
	// utilisateur déjà connecté voit brièvement l'écran de login avant la
	// redirection. Cohérent avec le gate de <RequireAuth />.
	if (isLoading) {
		return (
			<div className={styles.container}>
				<p className={styles.subtitle}>{t('auth.login.loading')}</p>
			</div>
		);
	}

	// Déjà connecté → on redirige direct vers la home appropriée
	if (currentUser) {
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
				<h1 className={styles.title}>{t('auth.login.title')}</h1>
				<p className={styles.subtitle}>{t('auth.login.subtitle')}</p>

				<TextField
					autoComplete="email"
					autoFocus
					label={t('auth.login.email')}
					name="email"
					onChange={(e) => setEmail(e.target.value)}
					required
					type="email"
					value={email}
				/>
				<TextField
					autoComplete="current-password"
					label={t('auth.login.password')}
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
					{loginMutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
				</Button>

				<p className={styles.forgotLink}>
					<Link to={paths.forgotPassword()}>{t('auth.login.forgot')}</Link>
				</p>
			</form>
		</div>
	);
};
