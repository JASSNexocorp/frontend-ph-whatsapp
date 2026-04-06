// Datos de ejemplo del catálogo (colecciones y productos) hasta conectar API.

import type { ColeccionMenuEjemplo } from '../models/menu.models';

export const MENU_CATALOGO_COLECCIONES: ColeccionMenuEjemplo[] = [
  {
    id: 'pizzas',
    nombre: 'Pizzas',
    productos: [
      {
        id: 'pizzas-pepperoni',
        nombre: 'Pepperoni Lovers',
        precio: 'Bs. 89',
        precioUnitario: 89,
        disponible: true,
        precioComparacionUnitario: 120,
        descripcion: 'Pizza clásica con pepperoni y mozzarella.',
        opciones: [
          {
            id: 'pizzas-pepperoni-extra-queso',
            etiqueta: 'Extra queso',
            extraPrecio: 12,
          },
          {
            id: 'pizzas-pepperoni-borde-queso',
            etiqueta: 'Borde de queso',
            extraPrecio: 18,
          },
        ],
      },
      {
        id: 'pizzas-suprema',
        nombre: 'Suprema',
        precio: 'Bs. 95',
        precioUnitario: 95,
        disponible: true,
        precioComparacionUnitario: 125,
        descripcion: 'Variedad de carnes y vegetales sobre masa tradicional.',
        opciones: [
          {
            id: 'pizzas-suprema-sin-cebolla',
            etiqueta: 'Sin cebolla',
            extraPrecio: 0,
          },
        ],
      },
      {
        id: 'pizzas-hawaiana',
        nombre: 'Hawaiana',
        precio: 'Bs. 82',
        precioUnitario: 82,
        disponible: true,
        descripcion: 'Jamón, piña y el toque dulce que te gusta.',
      },
    ],
  },
  {
    id: 'entradas',
    nombre: 'Entradas',
    productos: [
      {
        id: 'entradas-queso',
        nombre: 'Palitos de queso',
        precio: 'Bs. 35',
        precioUnitario: 35,
        disponible: true,
        descripcion: 'Crujientes por fuera, derretidos por dentro.',
        opciones: [
          {
            id: 'entradas-queso-salsa-extra',
            etiqueta: 'Salsa extra',
            extraPrecio: 5,
          },
        ],
      },
      {
        id: 'entradas-alitas',
        nombre: 'Alitas BBQ',
        precio: 'Bs. 48',
        precioUnitario: 48,
        disponible: true,
        descripcion: 'Bañadas en salsa barbacoa.',
      },
    ],
  },
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    productos: [
      {
        id: 'bebidas-gaseosa',
        nombre: 'Gaseosa 500 ml',
        precio: 'Bs. 15',
        precioUnitario: 15,
        disponible: true,
      },
      {
        id: 'bebidas-te',
        nombre: 'Té frío',
        precio: 'Bs. 18',
        precioUnitario: 18,
        disponible: true,
      },
    ],
  },
  {
    id: 'postres',
    nombre: 'Postres',
    productos: [
      {
        id: 'postres-cinnamon',
        nombre: 'Cinnamon Rolls',
        precio: 'Bs. 28',
        precioUnitario: 28,
        disponible: true,
      },
      {
        id: 'postres-brownie',
        nombre: 'Brownie',
        precio: 'Bs. 32',
        precioUnitario: 32,
        disponible: true,
      },
    ],
  },
  {
    id: 'promos',
    nombre: 'Promos',
    productos: [
      {
        id: 'promos-combo2',
        nombre: 'Combo 2 pizzas',
        precio: 'Bs. 160',
        precioUnitario: 160,
        disponible: true,
      },
      {
        id: 'promos-personal',
        nombre: 'Personal + bebida',
        precio: 'Bs. 45',
        precioUnitario: 45,
        disponible: true,
      },
    ],
  },
];
