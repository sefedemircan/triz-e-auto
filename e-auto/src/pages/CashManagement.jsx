import { useState, useEffect } from 'react'
import {
  Paper,
  Text,
  Group,
  Stack,
  Tabs,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  ThemeIcon,
  Grid,
  Divider,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconCash,
  IconArrowUp,
  IconArrowDown,
  IconPlus,
  IconEdit,
  IconTrash,
  IconReceipt,
  IconTags,
} from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

const TRANSACTION_TYPES = {
  income: {
    label: 'Gelir',
    color: 'green',
    icon: IconArrowUp,
  },
  expense: {
    label: 'Gider',
    color: 'red',
    icon: IconArrowDown,
  },
}

export default function CashManagement() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  })
  const [opened, setOpened] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [dateRange, setDateRange] = useState([null, null])
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [categoryModalOpened, setCategoryModalOpened] = useState(false)

  const form = useForm({
    initialValues: {
      transaction_date: new Date(),
      type: 'income',
      category: '',
      amount: 0,
      payment_method: 'cash',
      description: '',
      document_no: '',
    },
    validate: {
      category: (value) => !value && 'Kategori seçiniz',
      amount: (value) => value <= 0 && 'Geçerli bir tutar giriniz',
      transaction_date: (value) => !value && 'Tarih seçiniz',
    },
  })

  const categoryForm = useForm({
    initialValues: {
      name: '',
      type: 'income',
      description: '',
    },
    validate: {
      name: (value) => !value && 'Kategori adı giriniz',
    },
  })

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })

      if (error) throw error

      setTransactions(data)
      calculateStats(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'İşlemler yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Kategoriler yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const calculateStats = (data) => {
    const now = dayjs()
    const startOfMonth = now.startOf('month')
    const endOfMonth = now.endOf('month')

    const stats = data.reduce((acc, trx) => {
      const amount = trx.amount || 0
      const trxDate = dayjs(trx.transaction_date)
      const isThisMonth = trxDate.isBetween(startOfMonth, endOfMonth, null, '[]')

      if (trx.type === 'income') {
        acc.totalIncome += amount
        if (isThisMonth) acc.monthlyIncome += amount
      } else {
        acc.totalExpense += amount
        if (isThisMonth) acc.monthlyExpense += amount
      }

      return acc
    }, {
      totalIncome: 0,
      totalExpense: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
    })

    stats.balance = stats.totalIncome - stats.totalExpense
    setStats(stats)
  }

  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        transaction_date: dayjs(values.transaction_date).format('YYYY-MM-DD'),
      }

      if (editingTransaction) {
        const { error } = await supabase
          .from('cash_transactions')
          .update(formData)
          .eq('id', editingTransaction.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'İşlem güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('cash_transactions')
          .insert([formData])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni işlem eklendi',
          color: 'green',
        })
      }

      setOpened(false)
      form.reset()
      setEditingTransaction(null)
      fetchTransactions()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'İşlem silindi',
        color: 'green',
      })

      fetchTransactions()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const getFilteredTransactions = () => {
    return transactions.filter(trx => {
      if (activeTab !== 'all' && trx.type !== activeTab) {
        return false
      }

      if (dateRange[0] && dateRange[1]) {
        const trxDate = dayjs(trx.transaction_date)
        const startDate = dayjs(dateRange[0])
        const endDate = dayjs(dateRange[1])
        return trxDate.isBetween(startDate, endDate, 'day', '[]')
      }

      if (selectedMonth) {
        return dayjs(trx.transaction_date).format('YYYY-MM') === selectedMonth
      }

      return true
    })
  }

  const filteredTransactions = getFilteredTransactions()

  const getFilteredStats = () => {
    return filteredTransactions.reduce((acc, trx) => {
      const amount = trx.amount || 0
      if (trx.type === 'income') {
        acc.income += amount
      } else {
        acc.expense += amount
      }
      return acc
    }, { income: 0, expense: 0 })
  }

  const getPaymentMethodStats = () => {
    return filteredTransactions.reduce((acc, trx) => {
      const amount = trx.amount || 0
      acc[trx.payment_method] = (acc[trx.payment_method] || 0) + amount
      return acc
    }, {})
  }

  const getCategoryStats = () => {
    return filteredTransactions.reduce((acc, trx) => {
      const amount = trx.amount || 0
      acc[trx.category] = (acc[trx.category] || 0) + amount
      return acc
    }, {})
  }

  const getMonthOptions = () => {
    const options = []
    let date = dayjs().subtract(11, 'month')
    for (let i = 0; i < 12; i++) {
      options.push({
        value: date.format('YYYY-MM'),
        label: date.format('MMMM YYYY'),
      })
      date = date.add(1, 'month')
    }
    return options
  }

  const handleCategorySubmit = async (values) => {
    try {
      const { error } = await supabase
        .from('transaction_categories')
        .insert([{
          ...values,
          is_active: true
        }])

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Yeni kategori eklendi',
        color: 'green',
      })

      setCategoryModalOpened(false)
      categoryForm.reset()
      fetchCategories()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('transaction_categories')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Kategori silindi',
        color: 'green',
      })

      fetchCategories()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Group spacing="xs">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
            <IconCash size={20} />
          </ThemeIcon>
          <Text size="xl" weight={600}>Kasa Yönetimi</Text>
        </Group>
        <Group>
          <Button
            variant="light"
            leftSection={<IconTags size={20} />}
            onClick={() => setCategoryModalOpened(true)}
          >
            Kategoriler
          </Button>
          <Button
            leftSection={<IconPlus size={20} />}
            onClick={() => {
              form.reset()
              setEditingTransaction(null)
              setOpened(true)
            }}
          >
            Yeni İşlem
          </Button>
        </Group>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Group position="apart" mb="md">
          <Text weight={500}>Filtreler</Text>
          <Button 
            variant="subtle"
            onClick={() => {
              setDateRange([null, null])
              setSelectedMonth(dayjs().format('YYYY-MM'))
              setActiveTab('all')
            }}
          >
            Filtreleri Temizle
          </Button>
        </Group>

        <Grid>
          <Grid.Col span={4}>
            <Select
              label="Ay Seçimi"
              value={selectedMonth}
              onChange={setSelectedMonth}
              data={getMonthOptions()}
              clearable
              onClear={() => setSelectedMonth(null)}
            />
          </Grid.Col>
          <Grid.Col span={8}>
            <DatePickerInput
              type="range"
              label="Tarih Aralığı"
              value={dateRange}
              onChange={setDateRange}
              clearable
              valueFormat="DD.MM.YYYY"
              placeholder="Tarih aralığı seçin"
            />
          </Grid.Col>
        </Grid>
      </Paper>

      <Grid>
        <Grid.Col span={4}>
          <Paper withBorder p="md" radius="md">
            <Group position="apart" mb="xs">
              <Text size="sm" color="dimmed">Kasa Bakiyesi</Text>
              <ThemeIcon color={stats.balance >= 0 ? 'green' : 'red'} variant="light">
                {stats.balance >= 0 ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </ThemeIcon>
            </Group>
            <Text size="xl" weight={700} color={stats.balance >= 0 ? 'green' : 'red'}>
              {stats.balance.toLocaleString('tr-TR')} ₺
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={4}>
          <Paper withBorder p="md" radius="md">
            <Group position="apart" mb="xs">
              <Text size="sm" color="dimmed">Toplam Gelir</Text>
              <ThemeIcon color="green" variant="light">
                <IconArrowUp size={16} />
              </ThemeIcon>
            </Group>
            <Text size="xl" weight={700} color="green">
              {stats.totalIncome.toLocaleString('tr-TR')} ₺
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={4}>
          <Paper withBorder p="md" radius="md">
            <Group position="apart" mb="xs">
              <Text size="sm" color="dimmed">Toplam Gider</Text>
              <ThemeIcon color="red" variant="light">
                <IconArrowDown size={16} />
              </ThemeIcon>
            </Group>
            <Text size="xl" weight={700} color="red">
              {stats.totalExpense.toLocaleString('tr-TR')} ₺
            </Text>
          </Paper>
        </Grid.Col>

        {(dateRange[0] || selectedMonth) && (
          <>
            <Grid.Col span={12}>
              <Divider label={
                <Text size="sm" color="dimmed">
                  {dateRange[0] && dateRange[1] 
                    ? `${dayjs(dateRange[0]).format('DD.MM.YYYY')} - ${dayjs(dateRange[1]).format('DD.MM.YYYY')} Dönemi`
                    : `${dayjs(selectedMonth).format('MMMM YYYY')} Dönemi`
                  }
                </Text>
              } />
            </Grid.Col>

            <Grid.Col span={6}>
              <Paper withBorder p="md" radius="md">
                <Group position="apart" mb="xs">
                  <Text size="sm" color="dimmed">Dönem Geliri</Text>
                  <ThemeIcon color="green" variant="light">
                    <IconArrowUp size={16} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" weight={700} color="green">
                  {getFilteredStats().income.toLocaleString('tr-TR')} ₺
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={6}>
              <Paper withBorder p="md" radius="md">
                <Group position="apart" mb="xs">
                  <Text size="sm" color="dimmed">Dönem Gideri</Text>
                  <ThemeIcon color="red" variant="light">
                    <IconArrowDown size={16} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" weight={700} color="red">
                  {getFilteredStats().expense.toLocaleString('tr-TR')} ₺
                </Text>
              </Paper>
            </Grid.Col>
          </>
        )}
      </Grid>

      <Paper p="md" radius="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">Tüm İşlemler</Tabs.Tab>
            <Tabs.Tab 
              value="income"
              leftSection={<IconArrowUp size={16} />}
              color="green"
            >
              Gelirler
            </Tabs.Tab>
            <Tabs.Tab 
              value="expense"
              leftSection={<IconArrowDown size={16} />}
              color="red"
            >
              Giderler
            </Tabs.Tab>
          </Tabs.List>

          <Paper withBorder mt="md">
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Tarih</th>
                  <th style={{ textAlign: 'center' }}>Tür</th>
                  <th style={{ textAlign: 'center' }}>Kategori</th>
                  <th style={{ textAlign: 'center' }}>Açıklama</th>
                  <th style={{ textAlign: 'center' }}>Belge No</th>
                  <th style={{ textAlign: 'center' }}>Ödeme Şekli</th>
                  <th style={{ textAlign: 'center' }}>Tutar</th>
                  <th style={{ textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{dayjs(transaction.transaction_date).format('DD.MM.YYYY')}</td>
                    <td>
                      <Badge 
                        color={TRANSACTION_TYPES[transaction.type].color}
                        variant="light"
                      >
                        {TRANSACTION_TYPES[transaction.type].label}
                      </Badge>
                    </td>
                    <td>{transaction.category}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.document_no || '-'}</td>
                    <td>
                      <Badge variant="dot">
                        {transaction.payment_method === 'cash' ? 'Nakit' : 
                         transaction.payment_method === 'bank_transfer' ? 'Havale/EFT' :
                         transaction.payment_method === 'credit_card' ? 'Kredi Kartı' : 
                         'Çek'}
                      </Badge>
                    </td>
                    <td>
                      <Text 
                        weight={500} 
                        color={transaction.type === 'income' ? 'green' : 'red'}
                      >
                        {transaction.amount.toLocaleString('tr-TR')} ₺
                      </Text>
                    </td>
                    <td>
                      <Group spacing={4}>
                        <ActionIcon onClick={() => {
                          setEditingTransaction(transaction)
                          form.setValues({
                            ...transaction,
                            transaction_date: new Date(transaction.transaction_date),
                          })
                          setOpened(true)
                        }}>
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon color="red" onClick={() => handleDelete(transaction.id)}>
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Tabs>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
          form.reset()
          setEditingTransaction(null)
        }}
        title={
          <Group spacing="xs">
            <ThemeIcon color="violet" variant="light">
              <IconCash size={16} />
            </ThemeIcon>
            <Text>
              {editingTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem'}
            </Text>
          </Group>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              required
              label="İşlem Türü"
              data={Object.entries(TRANSACTION_TYPES).map(([value, { label }]) => ({
                value,
                label,
              }))}
              {...form.getInputProps('type')}
            />

            <Select
              required
              label="Kategori"
              data={categories
                .filter(cat => cat.type === form.values.type)
                .map(cat => ({
                  value: cat.name,
                  label: cat.name,
                }))}
              {...form.getInputProps('category')}
            />

            <Group grow>
              <NumberInput
                required
                label="Tutar"
                min={0}
                {...form.getInputProps('amount')}
              />
              <DatePickerInput
                required
                label="Tarih"
                valueFormat="DD.MM.YYYY"
                placeholder="Tarih seçin"
                {...form.getInputProps('transaction_date')}
              />
            </Group>

            <Select
              required
              label="Ödeme Şekli"
              data={[
                { value: 'cash', label: 'Nakit' },
                { value: 'bank_transfer', label: 'Havale/EFT' },
                { value: 'credit_card', label: 'Kredi Kartı' },
                { value: 'check', label: 'Çek' },
              ]}
              {...form.getInputProps('payment_method')}
            />

            <TextInput
              label="Açıklama"
              {...form.getInputProps('description')}
            />

            <TextInput
              label="Belge No"
              placeholder="Fiş/Fatura No"
              {...form.getInputProps('document_no')}
            />

            <Button type="submit">
              {editingTransaction ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={categoryModalOpened}
        onClose={() => {
          setCategoryModalOpened(false)
          categoryForm.reset()
        }}
        title={
          <Group spacing="xs">
            <ThemeIcon color="violet" variant="light">
              <IconTags size={16} />
            </ThemeIcon>
            <Text>Kategori Yönetimi</Text>
          </Group>
        }
        size="lg"
      >
        <Stack>
          <Paper withBorder p="md">
            <form onSubmit={categoryForm.onSubmit(handleCategorySubmit)}>
              <Stack>
                <TextInput
                  required
                  label="Kategori Adı"
                  {...categoryForm.getInputProps('name')}
                />
                <Select
                  required
                  label="Tür"
                  data={Object.entries(TRANSACTION_TYPES).map(([value, { label }]) => ({
                    value,
                    label,
                  }))}
                  {...categoryForm.getInputProps('type')}
                />
                <TextInput
                  label="Açıklama"
                  {...categoryForm.getInputProps('description')}
                />
                <Button type="submit">Kategori Ekle</Button>
              </Stack>
            </form>
          </Paper>

          <Divider label="Mevcut Kategoriler" />

          <Table>
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Tür</th>
                <th>Açıklama</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>
                    <Badge 
                      color={TRANSACTION_TYPES[category.type].color}
                      variant="light"
                    >
                      {TRANSACTION_TYPES[category.type].label}
                    </Badge>
                  </td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <ActionIcon 
                      color="red" 
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Stack>
      </Modal>
    </Stack>
  )
} 