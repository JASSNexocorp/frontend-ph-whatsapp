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
        opciones: [
          { id: 'pizzas-pepperoni-extra-queso', etiqueta: 'Extra queso' },
          { id: 'pizzas-pepperoni-borde-queso', etiqueta: 'Borde de queso' },
        ],
      },
      {
        id: 'pizzas-suprema',
        nombre: 'Suprema',
        precio: 'Bs. 95',
        precioUnitario: 95,
        opciones: [
          { id: 'pizzas-suprema-sin-cebolla', etiqueta: 'Sin cebolla' },
        ],
      },
      {
        id: 'pizzas-hawaiana',
        nombre: 'Hawaiana',
        precio: 'Bs. 82',
        precioUnitario: 82,
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
        opciones: [
          { id: 'entradas-queso-salsa-extra', etiqueta: 'Salsa extra' },
        ],
      },
      {
        id: 'entradas-alitas',
        nombre: 'Alitas BBQ',
        precio: 'Bs. 48',
        precioUnitario: 48,
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
      },
      {
        id: 'bebidas-te',
        nombre: 'Té frío',
        precio: 'Bs. 18',
        precioUnitario: 18,
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
      },
      {
        id: 'postres-brownie',
        nombre: 'Brownie',
        precio: 'Bs. 32',
        precioUnitario: 32,
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
      },
      {
        id: 'promos-personal',
        nombre: 'Personal + bebida',
        precio: 'Bs. 45',
        precioUnitario: 45,
      },
    ],
  },
];
