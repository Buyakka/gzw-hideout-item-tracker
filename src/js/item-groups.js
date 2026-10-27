// =============================================================
// ITEM GROUPS
// The game has no item categories, so these groups are our own,
// made from what each item is. They let the Shopping List show
// one kind of item at a time (for example only Electronics).
// An item missing here (new in a game update) goes to "Other".
// =============================================================
export const GROUPS = [
  {
    id: 'construction',
    label: 'Construction',
    items: [
      'Construction Material', 'Copper', 'Fabrics', 'Fine Metal Mesh', 'Glass',
      'Plastics', 'Silicone Sealant', 'Stainless Steel Sheet', 'Steel', 'Wood',
    ],
  },
  {
    id: 'electronics',
    label: 'Electronics',
    items: [
      'Analog Indicator', 'Circuit Board', 'Civilian Software', 'CPU', 'Electrical Parts',
      'Graphics Card', 'Laser Tube', 'Military Software', 'Motherboard', 'PC Fan',
      'Power Supply', 'RAM', 'Server CPU', 'Vapor Lamp',
    ],
  },
  {
    id: 'mechanical',
    label: 'Mechanical',
    items: ['Burner Head', 'Dynamo', 'HEPA Filter', 'Mechanical Parts', 'Plumbing Parts', 'Water Pump'],
  },
  {
    id: 'chemicals',
    label: 'Chemicals & Lab',
    items: [
      'Chemicals', 'Complex Glass Electrode', 'Crystal Prism', 'Laboratory Flask', 'Mechanical Pipette',
      'Microscope', 'Motor Oil', 'Refrigerant', 'Tooling Coolant', 'Zinc Electrode',
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: ['CNC Drill Bits', 'Multimeter', 'Oscilloscope', 'Signal Generator', 'Soldering Iron', 'Tool Set'],
  },
];

const GROUP_OF = new Map(GROUPS.flatMap((g) => g.items.map((item) => [item, g.id])));

export const groupOf = (item) => GROUP_OF.get(item) ?? 'other';
