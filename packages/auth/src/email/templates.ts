export function resetPasswordTemplate({
	name,
	resetUrl,
}: {
	name?: string | null;
	resetUrl: string;
}) {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
	<title>Réinitialisation du mot de passe</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;">
	<table width="100%" cellpadding="0" cellspacing="0">
		<tr>
			<td align="center" style="padding:40px 0;">
				<table width="600" style="background:#ffffff;border-radius:8px;padding:40px;">
					<tr>
						<td>
							<h2 style="margin-top:0;">Réinitialisez votre mot de passe</h2>
							<p>Bonjour ${name ?? ""},</p>
							<p>
                Nous avons reçu une demande de réinitialisation de votre mot de passe.
                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
							</p>

							<p style="text-align:center;margin:32px 0;">
								<a
									href="${resetUrl}"
									style="
										background:#2563eb;
										color:#ffffff;
										text-decoration:none;
										padding:12px 24px;
										border-radius:6px;
										display:inline-block;
										font-weight:bold;
									"
								>
									Choisir un nouveau mot de passe
								</a>
							</p>

							<p style="font-size:14px;color:#555;">
								Ce lien expirera bientôt. Si vous n'avez pas demandé
								une réinitialisation de mot de passe, vous pouvez ignorer cet email.
							</p>

							<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />

							<p style="font-size:12px;color:#888;">
								Rythmons – Secure authentication
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;
}
