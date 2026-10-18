import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paths } from '@/config/routes';

import { useRequestPasswordReset } from '@/api/auth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

import styles from './ForgotPasswordPage.module.scss';

export const ForgotPasswordPage = () => {
	const { t } = useTranslation();
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
					<h1 className={styles.title}>{t('auth.forgot.title')}</h1>
					<p className={styles.success}>{t('auth.forgot.successMessage')}</p>
					<p className={styles.backLink}>
						<Link to={paths.login()}>{t('auth.forgot.backToLogin')}</Link>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<form className={styles.card} onSubmit={onSubmit}>
				<h1 className={styles.title}>{t('auth.forgot.title')}</h1>
				<p className={styles.subtitle}>{t('auth.forgot.subtitle')}</p>

				<TextField
					autoComplete="email"
					autoFocus
					label={t('auth.forgot.email')}
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
					{requestMutation.isPending ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
				</Button>

				<p className={styles.backLink}>
					<Link to={paths.login()}>{t('auth.forgot.backToLogin')}</Link>
				</p>
			</form>
		</div>
	);
};
