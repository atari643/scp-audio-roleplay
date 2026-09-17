import os

from anthropic import Anthropic

# Récupération de votre clé API Claude
# Il est recommandé de la stocker dans une variable d'environnement ANTHROPIC_API_KEY
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "VOTRE_CLE_API_CLAUDE_ICI")

print("Initialisation du client Claude...")
client = Anthropic(api_key=API_KEY)

print("Envoi de la requête à Claude avec la configuration Effort MAX (Extended Thinking)...")

try:
    # La configuration en "Effort MAX" sur Claude passe par l'activation explicite
    # du bloc "thinking" (réflexion) avec un "budget_tokens" très élevé.
    response = client.messages.create(
        model="claude-3-7-sonnet-20250219",  # Modèle supportant la réflexion étendue
        max_tokens=20000,
        thinking={
            "type": "enabled",
            # Budget alloué à la réflexion (jusqu'à 64k selon les besoins)
            "budget_tokens": 16000,
        },
        messages=[
            {
                "role": "user",
                "content": (
                    "Écris-moi une fonction complexe en Python et "
                    "explique ton raisonnement pas à pas."
                ),
            }
        ],
    )

    print("\n--- RÉPONSE CLAUDE ---")
    # Affichage du contenu de la réponse (peut inclure le bloc de pensée et le texte final)
    for block in response.content:
        if block.type == "thinking":
            print("[RÉFLEXION INTERNE DE CLAUDE] :")
            print(block.thinking)
        elif block.type == "text":
            print("\n[RÉPONSE FINALE] :")
            print(block.text)
except Exception as e:
    print(f"Erreur lors de l'appel à l'API Claude : {e}")
