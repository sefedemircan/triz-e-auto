import {
  IconDashboard,
  IconCar,
  IconUsers,
  IconReceipt,
  IconSettings,
  IconBuildingWarehouse,
  IconReportMoney,
} from '@tabler/icons-react';

const menuItems = [
  { label: 'Gösterge Paneli', icon: IconDashboard, to: '/' },
  { label: 'Araçlar', icon: IconCar, to: '/vehicles' },
  { label: 'Personel', icon: IconUsers, to: '/employees' },
  { label: 'Bakım ve Giderler', icon: IconReceipt, to: '/maintenance' },
  { label: 'Satılan Araçlar', icon: IconBuildingWarehouse, to: '/sold-vehicles' },
  { label: 'Finansal Rapor', icon: IconReportMoney, to: '/financial-report' },
  { label: 'Ayarlar', icon: IconSettings, to: '/settings' },
]; 