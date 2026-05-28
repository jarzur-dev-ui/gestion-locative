import classNames from 'classnames';
import {
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type PointerEvent as ReactPointerEvent,
} from 'react';

import { Button } from '@/components/Button/Button';
import { TextField } from '@/components/TextField/TextField';

import styles from './SignaturePad.module.scss';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 120;
const FONT_SIZE = 56;

export interface SignaturePadProps {
	label: string;
	value: string;
	onChange: (dataUrl: string) => void;
}

type Mode = 'text' | 'draw';

export const SignaturePad = ({ label, value, onChange }: SignaturePadProps) => {
	const [mode, setMode] = useState<Mode>('text');
	const [text, setText] = useState('');
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawing = useRef(false);
	const last = useRef<{ x: number; y: number } | null>(null);

	const getCtx = (): CanvasRenderingContext2D | null => {
		const canvas = canvasRef.current;
		return canvas ? canvas.getContext('2d') : null;
	};

	const clearCanvas = (): void => {
		const ctx = getCtx();
		if (ctx) {
			ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		}
	};

	const emit = (): void => {
		if (canvasRef.current) {
			onChange(canvasRef.current.toDataURL('image/png'));
		}
	};

	const renderText = (val: string): void => {
		const ctx = getCtx();
		if (!ctx) {
			return;
		}
		clearCanvas();
		if (!val.trim()) {
			onChange('');
			return;
		}
		ctx.fillStyle = '#000';
		ctx.font = `${FONT_SIZE}px "Caveat", cursive`;
		ctx.textBaseline = 'middle';
		ctx.fillText(val, 12, CANVAS_HEIGHT / 2);
		emit();
	};

	useEffect(() => {
		clearCanvas();
		if (mode === 'text') {
			if ('fonts' in document) {
				document.fonts.load(`${FONT_SIZE}px "Caveat"`).then(() => renderText(text));
			} else {
				renderText(text);
			}
		} else {
			onChange('');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	const onTextChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const next = event.target.value;
		setText(next);
		renderText(next);
	};

	const positionOf = (
		event: ReactPointerEvent<HTMLCanvasElement>,
	): { x: number; y: number } => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return { x: 0, y: 0 };
		}
		const rect = canvas.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) * CANVAS_WIDTH) / rect.width,
			y: ((event.clientY - rect.top) * CANVAS_HEIGHT) / rect.height,
		};
	};

	const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
		if (mode !== 'draw') {
			return;
		}
		drawing.current = true;
		last.current = positionOf(event);
		canvasRef.current?.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
		if (mode !== 'draw' || !drawing.current) {
			return;
		}
		const ctx = getCtx();
		if (!ctx || !last.current) {
			return;
		}
		const p = positionOf(event);
		ctx.lineCap = 'round';
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#000';
		ctx.beginPath();
		ctx.moveTo(last.current.x, last.current.y);
		ctx.lineTo(p.x, p.y);
		ctx.stroke();
		last.current = p;
	};

	const onPointerUp = (): void => {
		if (mode !== 'draw' || !drawing.current) {
			return;
		}
		drawing.current = false;
		emit();
	};

	const onClear = (): void => {
		clearCanvas();
		setText('');
		onChange('');
	};

	return (
		<div className={styles.pad}>
			<div className={styles.head}>
				<span className={styles.label}>{label}</span>
				<div className={styles.tabs}>
					<button
						className={classNames(styles.tab, { [styles.active]: mode === 'text' })}
						onClick={() => setMode('text')}
						type="button"
					>
						Écrire
					</button>
					<button
						className={classNames(styles.tab, { [styles.active]: mode === 'draw' })}
						onClick={() => setMode('draw')}
						type="button"
					>
						Dessiner
					</button>
				</div>
			</div>

			{mode === 'text' ? (
				<TextField
					label="Nom et prénom"
					onChange={onTextChange}
					placeholder="ex. Jean DUPONT"
					value={text}
				/>
			) : (
				<p className={styles.hint}>
					Trace ta signature dans le cadre (souris ou écran tactile).
				</p>
			)}

			<canvas
				className={classNames(styles.canvas, {
					[styles.canvasDraw]: mode === 'draw',
				})}
				height={CANVAS_HEIGHT}
				onPointerDown={onPointerDown}
				onPointerLeave={onPointerUp}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				ref={canvasRef}
				width={CANVAS_WIDTH}
			/>

			<div className={styles.actions}>
				<Button onClick={onClear} variant="ghost">
					Effacer
				</Button>
				{value ? (
					<span className={styles.status}>Signature enregistrée ✓</span>
				) : null}
			</div>
		</div>
	);
};
