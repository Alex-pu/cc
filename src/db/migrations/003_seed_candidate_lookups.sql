insert into skills (name, slug)
values
  ('Customer Service', 'customer-service'),
  ('Table Service', 'table-service'),
  ('Front Desk Operations', 'front-desk-operations'),
  ('Guest Relations', 'guest-relations'),
  ('Housekeeping', 'housekeeping'),
  ('Room Cleaning', 'room-cleaning'),
  ('Laundry', 'laundry'),
  ('Food Handling', 'food-handling'),
  ('Kitchen Prep', 'kitchen-prep'),
  ('Cash Handling', 'cash-handling'),
  ('POS Systems', 'pos-systems'),
  ('Inventory Support', 'inventory-support'),
  ('Office Administration', 'office-administration'),
  ('Calendar Management', 'calendar-management'),
  ('Phone Etiquette', 'phone-etiquette'),
  ('Basic Computer Skills', 'basic-computer-skills'),
  ('Event Setup', 'event-setup'),
  ('Deep Cleaning', 'deep-cleaning')
on conflict (slug) do nothing;

insert into languages (name, slug)
values
  ('English', 'english'),
  ('Swahili', 'swahili'),
  ('French', 'french'),
  ('Arabic', 'arabic'),
  ('German', 'german'),
  ('Spanish', 'spanish')
on conflict (slug) do nothing;
