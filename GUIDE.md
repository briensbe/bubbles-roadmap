# 📊 Mode d'Emploi : Bubble Chart Project Manager

## 🎯 Le "Why" (Pourquoi cet outil ?)

Le **Bubble Chart** est conçu pour transformer une liste de projets abstraite en une vision stratégique immédiate. Il permet d'arbitrer votre roadmap en visualisant simultanément trois dimensions critiques :

- **Position Horizontale :** Chronologie / Échéance.
- **Position Verticale :** Valeur Business.
- **Taille de la bulle :** Complexité technique (effort).

L'objectif est d'identifier en un coup d'œil les "Quick Wins" (Haute valeur / Basse complexité) et les projets à risque.

---

## 🛠 Fonctionnalités Interactives

### 🖱 Double-clic : Édition directe

Plus besoin de basculer entre différents menus pour corriger une information.

- **Action :** Double-cliquez sur une bulle dans le graphique.
- **Résultat :** Ouvre un formulaire d'édition permettant de modifier le nom ou les détails du projet directement dans la vue Chart.

### ↔️ Resize : Ajuster la complexité

L'estimation d'un projet évolue ? Modifiez-la graphiquement.

- **Action :** Sélectionnez et étirez le bord d'une bulle.
- **Résultat :** Ajuste visuellement la taille et met à jour automatiquement le score de **complexité** associé.

### ✋ Drag & Drop (avec Lock 🔒)

Repositionnez vos projets intuitivement pour changer leurs indicateurs.

- **Déplacement :** Glissez une bulle pour modifier sa valeur ou sa date.
- **Fonction Lock :** Activez le verrou pour figer l'axe des dates. Cela permet de déplacer une bulle verticalement (pour ajuster la valeur) sans risquer de décaler le calendrier par erreur.

### 📋 Vue Liste

Pour une précision maximale, une vue alternative sous forme de tableau est disponible.

- Permet de consulter l'intégralité des détails textuels.
- Synchronisation bidirectionnelle : toute modification en liste est répercutée sur le graphique et inversement.

---

## 📥 Import / Export

Le projet offre une flexibilité totale pour la gestion de vos données :

| Format    | Description      | Usage                                                                 |
| :-------- | :--------------- | :-------------------------------------------------------------------- |
| **JSON**  | Format technique | Sauvegarde complète de la configuration et transfert entre instances. |
| **Excel** | Format tableur   | Idéal pour le reporting ou pour préparer vos données avant import.    |

---

> **Note :** Pour garantir l'intégrité de vos données lors de sessions collaboratives, pensez à utiliser le **Lock** avant de manipuler des volumes importants de bulles sur le graphique.
