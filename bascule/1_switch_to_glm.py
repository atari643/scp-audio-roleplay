import os

from openai import OpenAI

# GLM-5.3-Flash est un modèle récent (Août 2026) de Zhipu AI (Z.ai)
# Il offre de hautes performances à coût réduit avec des capacités de raisonnement intégrées.

# La clé vit dans `.env` (ignoré par git), jamais dans le code : une clé en dur finit
# toujours par partir dans un commit ou un partage d'écran.
API_KEY = os.environ.get("ZHIPU_API_KEY", "")
if not API_KEY:
    raise SystemExit("ZHIPU_API_KEY absent de l'environnement — voir .env")

# Utilisation de l'URL internationale Zhipu ou chinoise
BASE_URL = "https://api.z.ai/api/paas/v4/"  # ou "https://open.bigmodel.cn/api/paas/v4/"

print("Initialisation du client GLM...")
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

print("Envoi de la requête à GLM-5.3-Flash avec l'équivalent de l'effort MAX...")

try:
    response = client.chat.completions.create(
        model="glm-5.3-flash",
        messages=[
            {
                "role": "user",
                "content": (
                    "Écris-moi une fonction complexe en Python et "
                    "explique ton raisonnement pas à pas."
                ),
            }
        ],
        # L'équivalent de l'effort MAX chez Zhipu pour les modèles qui le supportent
        # se gère souvent via un paramètre de raisonnement (comme "reasoning_effort" ou similaire)
        extra_body={"reasoning_effort": "high"},  # ou "max" selon l'intégration exacte
    )

    print("\n--- RÉPONSE GLM-5.3-Flash ---")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Erreur lors de l'appel à l'API GLM : {e}")
