/* Base d'aliments courants — valeurs approximatives pour 100g (source : tables nutritionnelles usuelles). */
const FoodDB = (() => {
  const FOODS = [
    // Féculents
    { name: 'Riz blanc cuit', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { name: 'Riz complet cuit', kcal: 123, protein: 2.6, carbs: 25, fat: 1 },
    { name: 'Pâtes cuites', kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
    { name: 'Pain blanc', kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
    { name: 'Pain complet', kcal: 247, protein: 13, carbs: 41, fat: 3.4 },
    { name: 'Pomme de terre cuite', kcal: 87, protein: 2, carbs: 20, fat: 0.1 },
    { name: 'Patate douce cuite', kcal: 90, protein: 2, carbs: 21, fat: 0.1 },
    { name: "Flocons d'avoine", kcal: 372, protein: 13.5, carbs: 60, fat: 7 },
    { name: 'Quinoa cuit', kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 },
    { name: 'Semoule cuite', kcal: 112, protein: 3.8, carbs: 23, fat: 0.2 },
    { name: 'Lentilles cuites', kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
    { name: 'Pois chiches cuits', kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 },
    { name: 'Haricots rouges cuits', kcal: 127, protein: 8.7, carbs: 23, fat: 0.5 },

    // Viandes / poissons / oeufs
    { name: 'Blanc de poulet cuit', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Blanc de dinde cuit', kcal: 135, protein: 29, carbs: 0, fat: 1.7 },
    { name: 'Steak haché 5%', kcal: 139, protein: 21, carbs: 0, fat: 5 },
    { name: 'Steak haché 15%', kcal: 215, protein: 19, carbs: 0, fat: 15 },
    { name: 'Boeuf (bavette) cuit', kcal: 190, protein: 28, carbs: 0, fat: 8 },
    { name: 'Porc (filet) cuit', kcal: 143, protein: 27, carbs: 0, fat: 3.5 },
    { name: 'Jambon blanc', kcal: 107, protein: 18, carbs: 0.5, fat: 3 },
    { name: 'Saumon cuit', kcal: 208, protein: 22, carbs: 0, fat: 13 },
    { name: 'Cabillaud cuit', kcal: 105, protein: 23, carbs: 0, fat: 1 },
    { name: 'Thon au naturel (boîte)', kcal: 116, protein: 26, carbs: 0, fat: 1 },
    { name: 'Crevettes cuites', kcal: 99, protein: 21, carbs: 0.2, fat: 1 },
    { name: 'Oeuf entier', kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
    { name: "Blanc d'oeuf", kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
    { name: 'Tofu ferme', kcal: 145, protein: 15, carbs: 2, fat: 9 },

    // Produits laitiers
    { name: 'Fromage blanc 0%', kcal: 45, protein: 8, carbs: 4, fat: 0.2 },
    { name: 'Fromage blanc 20%', kcal: 90, protein: 7, carbs: 4, fat: 5 },
    { name: 'Yaourt nature', kcal: 61, protein: 4, carbs: 5, fat: 3 },
    { name: 'Yaourt grec', kcal: 97, protein: 9, carbs: 4, fat: 5 },
    { name: 'Skyr', kcal: 63, protein: 11, carbs: 4, fat: 0.2 },
    { name: 'Cottage cheese', kcal: 98, protein: 11, carbs: 3.4, fat: 4.3 },
    { name: 'Lait demi-écrémé', kcal: 46, protein: 3.3, carbs: 4.8, fat: 1.6 },
    { name: 'Lait entier', kcal: 64, protein: 3.2, carbs: 4.8, fat: 3.6 },
    { name: 'Emmental', kcal: 380, protein: 28, carbs: 0.5, fat: 30 },
    { name: 'Mozzarella', kcal: 280, protein: 22, carbs: 2, fat: 20 },
    { name: 'Beurre', kcal: 745, protein: 0.7, carbs: 0.5, fat: 82 },

    // Fruits
    { name: 'Banane', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    { name: 'Pomme', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    { name: 'Orange', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 },
    { name: 'Fraises', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
    { name: 'Myrtilles', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 },
    { name: 'Raisin', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 },
    { name: 'Kiwi', kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 },
    { name: 'Ananas', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 },
    { name: 'Mangue', kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 },
    { name: 'Avocat', kcal: 160, protein: 2, carbs: 8.5, fat: 15 },
    { name: 'Amandes', kcal: 579, protein: 21, carbs: 22, fat: 50 },
    { name: 'Noix de cajou', kcal: 553, protein: 18, carbs: 30, fat: 44 },
    { name: 'Cacahuètes', kcal: 567, protein: 26, carbs: 16, fat: 49 },
    { name: 'Dattes', kcal: 282, protein: 2.5, carbs: 75, fat: 0.4 },

    // Légumes
    { name: 'Brocoli cuit', kcal: 35, protein: 2.4, carbs: 7, fat: 0.4 },
    { name: 'Haricots verts cuits', kcal: 31, protein: 1.8, carbs: 7, fat: 0.1 },
    { name: 'Carotte', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
    { name: 'Courgette cuite', kcal: 17, protein: 1.2, carbs: 3, fat: 0.3 },
    { name: 'Épinards cuits', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    { name: 'Tomate', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    { name: 'Salade verte', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
    { name: 'Poivron', kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
    { name: 'Champignons de Paris', kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
    { name: 'Concombre', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
    { name: 'Oignon', kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 },

    // Matières grasses / condiments
    { name: "Huile d'olive", kcal: 884, protein: 0, carbs: 0, fat: 100 },
    { name: 'Huile de coco', kcal: 862, protein: 0, carbs: 0, fat: 100 },
    { name: 'Beurre de cacahuète', kcal: 588, protein: 25, carbs: 20, fat: 50 },
    { name: 'Mayonnaise', kcal: 680, protein: 1, carbs: 2, fat: 75 },
    { name: 'Ketchup', kcal: 112, protein: 1.2, carbs: 27, fat: 0.2 },
    { name: 'Miel', kcal: 304, protein: 0.3, carbs: 82, fat: 0 },
    { name: 'Confiture', kcal: 250, protein: 0.3, carbs: 62, fat: 0.1 },

    // Compléments / snacks / divers
    { name: 'Whey protéine (poudre)', kcal: 380, protein: 75, carbs: 8, fat: 6 },
    { name: 'Barre protéinée', kcal: 350, protein: 30, carbs: 35, fat: 10 },
    { name: 'Chocolat noir 70%', kcal: 598, protein: 7.8, carbs: 46, fat: 42 },
    { name: 'Chocolat au lait', kcal: 535, protein: 7.6, carbs: 59, fat: 30 },
    { name: 'Chips', kcal: 536, protein: 6.6, carbs: 53, fat: 34 },
    { name: 'Pop-corn nature', kcal: 387, protein: 12.9, carbs: 78, fat: 4.5 },
    { name: 'Riz au lait', kcal: 120, protein: 3.5, carbs: 20, fat: 3 },
    { name: 'Compote sans sucre ajouté', kcal: 55, protein: 0.3, carbs: 13, fat: 0.1 },
    { name: 'Houmous', kcal: 166, protein: 7.9, carbs: 14, fat: 9.6 },
    { name: 'Granola', kcal: 471, protein: 10, carbs: 64, fat: 20 },

    // Boissons
    { name: "Jus d'orange", kcal: 45, protein: 0.7, carbs: 10, fat: 0.2 },
    { name: 'Coca-Cola', kcal: 42, protein: 0, carbs: 10.6, fat: 0 },
    { name: "Lait d'amande", kcal: 24, protein: 0.5, carbs: 3, fat: 1.1 },
    { name: 'Lait de soja', kcal: 33, protein: 3.3, carbs: 1, fat: 1.8 }
  ];

  function search(query, limit = 8) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return FOODS.filter(f => f.name.toLowerCase().includes(q)).slice(0, limit);
  }

  return { FOODS, search };
})();

window.FoodDB = FoodDB;
