import { useState, useEffect } from "react";
import {
  Paper,
  Text,
  Group,
  Grid,
  Stack,
  Badge,
  Divider,
  ThemeIcon,
  Table,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";
import {
  IconCar,
  IconCalendar,
  IconTool,
  IconSettings,
  IconReceipt,
  IconShieldCheck,
} from "@tabler/icons-react";
import classes from "../styles/Paper.module.css";

const EXPENSE_TYPES = {
  maintenance: {
    label: "Periyodik Bakım",
    color: "blue",
    icon: IconTool,
  },
  repair: {
    label: "Tamir",
    color: "red",
    icon: IconSettings,
  },
  insurance: {
    label: "Sigorta",
    color: "green",
    icon: IconShieldCheck,
  },
  other: {
    label: "Diğer",
    color: "gray",
    icon: IconReceipt,
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    soldVehicles: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    monthlyExpenses: 0,
    monthlySales: 0,
    recentSales: [],
    upcomingSalaries: [],
  });

  const [maintenanceStats, setMaintenanceStats] = useState({
    totalExpenses: 0,
    upcomingServices: [],
    recentExpenses: [],
    expensesByType: {
      maintenance: 0,
      repair: 0,
      insurance: 0,
      other: 0,
    },
  });

  const [recentSales, setRecentSales] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchMaintenanceStats();
    fetchRecentSales();
    fetchRecentExpenses();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Araç istatistikleri
      const { data: vehicles } = await supabase.from("vehicles").select("*");

      const { data: employees } = await supabase.from("employees").select("*");

      const { data: expenses } = await supabase
        .from("vehicle_expenses")
        .select("*");

      // Bu ayın başlangıç ve bitiş tarihleri
      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

      // Son satışlar (son 5)
      const { data: recentSales } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate,
          brand_id,
          model_id,
          sale_date,
          sale_price,
          purchase_price,
          brand:brand_id(name),
          model:model_id(name)
        `)
        .eq('status', 'sold')
        .order('created_at', { ascending: false })
        .limit(5);

      // Yaklaşan maaş ödemeleri - sadece maaş tutarları
      const upcomingSalaries = employees
        .map((employee) => {
          const nextPaymentDate = dayjs().date(employee.salary_day);
          // Eğer bu ayki ödeme günü geçtiyse, gelecek ayın tarihini hesapla
          const paymentDate = nextPaymentDate.isBefore(dayjs())
            ? nextPaymentDate.add(1, "month")
            : nextPaymentDate;

          return {
            ...employee,
            nextPayment: paymentDate.format("DD.MM.YYYY"),
            salary: employee.salary || 0,
            insurance: employee.insurance_amount || 0,
            foodAllowance: employee.food_allowance || 0,
            // Her ödeme türü için ayrı alanlar
            paymentDetails: [
              { label: "Maaş", amount: employee.salary || 0 },
              { label: "SGK", amount: employee.insurance_amount || 0 },
              { label: "Yemek", amount: employee.food_allowance || 0 },
            ],
          };
        })
        .sort((a, b) => dayjs(a.nextPayment).diff(dayjs(b.nextPayment))); // Tarihe göre sırala

      // Toplam gelir hesaplama (satılan araçların satış fiyatları toplamı)
      const totalRevenue = vehicles
        .filter((v) => v.status === "sold")
        .reduce((sum, v) => sum + (v.sale_price || 0), 0);

      // Toplam gider hesaplama
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      setStats({
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === "available")
          .length,
        soldVehicles: vehicles.filter((v) => v.status === "sold").length,
        totalEmployees: employees.length,
        totalRevenue: totalRevenue,
        totalExpenses: totalExpenses,
        totalProfit: totalRevenue - totalExpenses, // Yeni kar hesaplaması
        monthlyExpenses: expenses
          .filter(
            (exp) =>
              exp.expense_date >= startOfMonth && exp.expense_date <= endOfMonth
          )
          .reduce((sum, exp) => sum + exp.amount, 0),
        monthlySales: vehicles
          .filter(
            (v) =>
              v.status === "sold" &&
              v.sale_date >= startOfMonth &&
              v.sale_date <= endOfMonth
          )
          .reduce((sum, v) => sum + (v.sale_price - v.purchase_price), 0),
        recentSales,
        upcomingSalaries,
      });
    } catch (error) {
      notifications.show({
        title: "Hata",
        message: "Veriler yüklenirken bir hata oluştu",
        color: "red",
      });
    }
  };

  const fetchMaintenanceStats = async () => {
    try {
      const { data: expenses, error: expensesError } = await supabase
        .from('vehicle_expenses')
        .select(`
          id,
          expense_type,
          amount,
          description,
          expense_date,
          vehicle:vehicle_id(
            id,
            plate,
            brand:brand_id(name),
            model:model_id(name)
          )
        `)
        .order('expense_date', { ascending: false })

      if (expensesError) throw expensesError

      // Gider tipine göre toplam tutarlar
      const expensesByType = expenses.reduce(
        (acc, expense) => {
          acc[expense.expense_type] = (acc[expense.expense_type] || 0) + expense.amount
          return acc
        },
        {
          maintenance: 0,
          repair: 0,
          insurance: 0,
          other: 0,
        }
      )

      setMaintenanceStats({
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        recentExpenses: expenses.slice(0, 10),
        expensesByType,
      })
    } catch (error) {
      console.error('Error fetching maintenance stats:', error)
      notifications.show({
        title: 'Hata',
        message: 'Bakım istatistikleri yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  // Satılan araçları getir
  const fetchRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate,
          brand_id,
          model_id,
          sale_date,
          sale_price,
          purchase_price,
          brand:brand_id(name),
          model:model_id(name)
        `)
        .eq('status', 'sold')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentSales(data || [])
    } catch (error) {
      console.error('Error fetching recent sales:', error)
    }
  }

  // Son giderleri getir
  const fetchRecentExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_expenses')
        .select(`
          id,
          expense_type,
          amount,
          description,
          expense_date,
          vehicle:vehicle_id(
            id,
            plate,
            brand:brand_id(name),
            model:model_id(name)
          )
        `)
        .order('expense_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentExpenses(data || [])
    } catch (error) {
      console.error('Error fetching recent expenses:', error)
    }
  }

  // En yüksek gider kategorisini hesaplayan fonksiyon
  const getMaxExpenseType = () => {
    const maxType = Object.entries(maintenanceStats.expensesByType).reduce(
      (max, [key, amount]) => (amount > max.amount ? { key, amount } : max),
      { key: "", amount: 0 }
    );

    return maxType.amount === 0 ? null : maxType;
  };

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Text size="xl" weight={600} color="indigo">
          Genel Bakış
        </Text>
        <Text size="sm" color="dimmed">
          {dayjs().format("DD MMMM YYYY")}
        </Text>
      </Group>

      <Grid>
        <Grid.Col span={3}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.totalVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Toplam Araç
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={3}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.availableVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Satışta
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={3}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.soldVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Satılan
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={3}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.totalEmployees}</Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Toplam Personel
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={4}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">
                {stats.totalRevenue.toLocaleString("tr-TR")} ₺
              </Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Toplam Gelir
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={4}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">
                {stats.totalExpenses.toLocaleString("tr-TR")} ₺
              </Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Toplam Gider
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={4}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">
                {stats.totalProfit.toLocaleString("tr-TR")} ₺
              </Badge>
            </Group>
            <Text size="sm" color="dimmed">
              Toplam Kar
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <Paper p="xl">
            <Group position="apart" mb="lg">
              <Text weight={500}>Son Satışlar</Text>
              <Badge variant="dot">Son 5 Satış</Badge>
            </Group>
            {recentSales?.map((sale) => (
              <Group key={sale.id} position="apart" mb="md">
                <Stack spacing={4}>
                  <Text weight={500}>
                    {sale.brand?.name} {sale.model?.name}
                  </Text>
                  <Group spacing={6}>
                    <IconCalendar size={14} />
                    <Text size="sm" color="dimmed">
                      {dayjs(sale.sale_date).format("DD.MM.YYYY")}
                    </Text>
                  </Group>
                </Stack>
                <Badge color="green" size="lg" variant="light">
                  {(sale.sale_price - sale.purchase_price).toLocaleString(
                    "tr-TR"
                  )}{" "}
                  ₺
                </Badge>
              </Group>
            ))}
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p="xl">
            <Group position="apart" mb="lg">
              <Text weight={500}>Yaklaşan Maaş Ödemeleri</Text>
              <Badge variant="dot">Yaklaşan Ödemeler</Badge>
            </Group>
            {stats.upcomingSalaries.map((employee) => (
              <Stack key={employee.id} mb="md" spacing="xs">
                <Group position="apart">
                  <Group spacing="xs">
                    <Text weight={500}>
                      {employee.first_name} {employee.last_name}
                    </Text>
                    <Badge size="sm" variant="dot">
                      {employee.nextPayment}
                    </Badge>
                  </Group>
                </Group>
                <Group spacing="lg">
                  {employee.paymentDetails.map(
                    (payment, index) =>
                      payment.amount > 0 && (
                        <Group key={index} spacing={4}>
                          <Text size="sm" color="dimmed">
                            {payment.label}:
                          </Text>
                          <Text size="sm" weight={500}>
                            {payment.amount.toLocaleString("tr-TR")} ₺
                          </Text>
                        </Group>
                      )
                  )}
                </Group>
                <Divider />
              </Stack>
            ))}
            {stats.upcomingSalaries.length === 0 && (
              <Text color="dimmed" align="center">
                Yaklaşan maaş ödemesi bulunmuyor
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={12}>
          <Paper p="xl">
            <Group position="apart" mb="lg">
              <Group spacing="xs">
                <ThemeIcon color="blue" variant="light">
                  <IconTool size={18} />
                </ThemeIcon>
                <Text weight={500}>Bakım ve Giderler</Text>
              </Group>
              <Badge variant="dot">Son İşlemler</Badge>
            </Group>

            <Grid mb="md">
              <Grid.Col span={3}>
                <Paper withBorder p="md" radius="md">
                  <Group position="apart" mb="xs">
                    <Text size="sm" color="dimmed">
                      Toplam Gider
                    </Text>
                    <ThemeIcon color="red" variant="light">
                      <IconReceipt size={16} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" weight={700} color="red">
                    {maintenanceStats.totalExpenses.toLocaleString("tr-TR")} ₺
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper withBorder p="md" radius="md">
                  <Group position="apart" mb="xs">
                    <Text size="sm" color="dimmed">
                      Bu Ayki Gider
                    </Text>
                    <ThemeIcon color="orange" variant="light">
                      <IconCalendar size={16} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" weight={700} color="orange">
                    {maintenanceStats.recentExpenses
                      .filter(
                        (exp) =>
                          dayjs(exp.expense_date).format("MM-YYYY") ===
                          dayjs().format("MM-YYYY")
                      )
                      .reduce((sum, exp) => sum + exp.amount, 0)
                      .toLocaleString("tr-TR")}{" "}
                    ₺
                  </Text>
                </Paper>
              </Grid.Col>

              {Object.entries(EXPENSE_TYPES).map(
                ([key, { label, icon: Icon, color }]) => {
                  const amount = maintenanceStats.expensesByType[key];
                  if (amount === 0) return null;

                  return (
                    <Grid.Col span={3} key={key}>
                      <Paper withBorder p="md" radius="md">
                        <Group position="apart" mb="xs">
                          <Text size="sm" color="dimmed">
                            {label}
                          </Text>
                          <ThemeIcon color={color} variant="light">
                            <Icon size={16} />
                          </ThemeIcon>
                        </Group>
                        <Text size="xl" weight={700} color={color}>
                          {amount.toLocaleString("tr-TR")} ₺
                        </Text>
                      </Paper>
                    </Grid.Col>
                  );
                }
              )}
            </Grid>

            <Divider mb="md" />

            <Paper withBorder>
              <Table highlightOnHover>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>Tarih</th>
                    <th style={{ textAlign: "center" }}>Araç</th>
                    <th style={{ textAlign: "center" }}>Plaka</th>
                    <th style={{ textAlign: "center" }}>Kategori</th>
                    <th style={{ textAlign: "center" }}>Açıklama</th>
                    <th style={{ textAlign: "center" }}>Tutar</th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "center" }}>
                  {recentExpenses?.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        {dayjs(expense.expense_date).format("DD.MM.YYYY")}
                      </td>
                      <td>
                        {expense.vehicle ? (
                          <Text size="sm">
                            {expense.vehicle.brand?.name} {expense.vehicle.model?.name}
                          </Text>
                        ) : (
                          <Text size="sm" color="dimmed">
                            -
                          </Text>
                        )}
                      </td>
                      <td>
                        {expense.vehicle ? (
                          <Badge variant="dot" color="gray">
                            {expense.vehicle.plate}
                          </Badge>
                        ) : (
                          <Text size="xs" color="dimmed">
                            -
                          </Text>
                        )}
                      </td>
                      <td>
                        <Badge
                          color={EXPENSE_TYPES[expense.expense_type].color}
                          variant="light"
                        >
                          {EXPENSE_TYPES[expense.expense_type].label}
                        </Badge>
                      </td>
                      <td>{expense.description}</td>
                      <td>
                        <Text weight={500} color="red">
                          {expense.amount.toLocaleString("tr-TR")} ₺
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Paper>

            {recentExpenses?.length === 0 && (
              <Text color="dimmed" align="center" mt="md">
                Henüz gider kaydı bulunmuyor
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
