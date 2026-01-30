"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InlineEditTextProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	className?: string;
	inputClassName?: string;
	multiline?: boolean;
	rows?: number;
	canEdit?: boolean;
}

export function InlineEditText({
	value,
	onSave,
	placeholder = "Cliquez pour éditer...",
	className,
	inputClassName,
	multiline = false,
	rows = 3,
	canEdit = true,
}: InlineEditTextProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);
	const [isSaving, setIsSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

	useEffect(() => {
		setEditValue(value);
	}, [value]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSave = useCallback(async () => {
		if (editValue === value) {
			setIsEditing(false);
			return;
		}

		setIsSaving(true);
		try {
			await onSave(editValue);
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to save:", error);
			setEditValue(value); // Revert on error
		} finally {
			setIsSaving(false);
		}
	}, [editValue, value, onSave]);

	const handleCancel = () => {
		setEditValue(value);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !multiline) {
			e.preventDefault();
			handleSave();
		}
		if (e.key === "Escape") {
			handleCancel();
		}
	};

	if (!canEdit) {
		return (
			<span className={cn("block", className)}>
				{value || <span className="text-white/30 italic">{placeholder}</span>}
			</span>
		);
	}

	if (isEditing) {
		const InputComponent = multiline ? "textarea" : "input";
		return (
			<div className="relative">
				<InputComponent
					ref={inputRef as any}
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					rows={multiline ? rows : undefined}
					disabled={isSaving}
					className={cn(
						"w-full rounded-lg border border-primary bg-black/50 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary/50",
						multiline && "resize-none",
						inputClassName,
					)}
					placeholder={placeholder}
				/>
				<div className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-1">
					{isSaving ? (
						<Loader2 className="h-4 w-4 animate-spin text-primary" />
					) : (
						<>
							<button
								type="button"
								onClick={handleSave}
								className="rounded p-1 text-green-400 hover:bg-green-400/20"
							>
								<Check className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={handleCancel}
								className="rounded p-1 text-red-400 hover:bg-red-400/20"
							>
								<X className="h-4 w-4" />
							</button>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setIsEditing(true)}
			className={cn(
				"group relative block w-full cursor-pointer rounded-lg px-2 py-1 text-left transition-colors hover:bg-white/10",
				className,
			)}
		>
			{value || <span className="text-white/30 italic">{placeholder}</span>}
			<Pencil className="absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-white/30 opacity-0 transition-opacity group-hover:opacity-100" />
		</button>
	);
}
