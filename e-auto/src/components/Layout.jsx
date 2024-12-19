import { useState } from 'react'
import {
  AppShell,
  Group,
  Text,
  UnstyledButton,
  ThemeIcon,
  Divider,
  Stack,
  ActionIcon,
  Box,
  Paper,
} from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  IconDashboard,
  IconCar,
  IconUsers,
  IconUserOff,
  IconLogout,
  IconCarOff,
  IconMenu2,
  IconChartBar,
} from '@tabler/icons-react'

const mainLinks = [
  { icon: IconDashboard, color: 'blue', label: 'Genel Bakış', to: '/' },
  { icon: IconCar, color: 'teal', label: 'Araçlar', to: '/vehicles' },
  { icon: IconCarOff, color: 'grape', label: 'Satılan Araçlar', to: '/sold-vehicles' },
  { icon: IconUsers, color: 'orange', label: 'Personel', to: '/employees' },
  { icon: IconUserOff, color: 'red', label: 'Eski Personel', to: '/ex-employees' },
  { icon: IconChartBar, color: 'green', label: 'Finansal Rapor', to: '/financial-report' },
]

export default function Layout({ children }) {
  const [opened, setOpened] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()

  const MainLink = ({ icon: Icon, color, label, to }) => {
    const isActive = location.pathname === to
    
    return (
      <UnstyledButton
        onClick={() => {
          navigate(to)
          setOpened(false)
        }}
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          transition: 'all 0.2s ease',
          backgroundColor: isActive ? 
            `${theme.colors[color][0]}` : 'transparent',
          color: isActive ? theme.colors[color][7] : theme.black,
          '&:hover': {
            backgroundColor: theme.colors[color][0],
            transform: 'translateX(4px)',
          },
        })}
      >
        <Group spacing="md">
          <ThemeIcon 
            color={color} 
            variant={isActive ? 'filled' : 'light'}
            size="lg"
          >
            <Icon size={18} />
          </ThemeIcon>
          <div>
            <Text size="sm" weight={500}>{label}</Text>
            {isActive && (
              <Text size="xs" color="dimmed">
                {getMenuDescription(to)}
              </Text>
            )}
          </div>
        </Group>
      </UnstyledButton>
    )
  }

  // Menü açıklamaları için yardımcı fonksiyon
  const getMenuDescription = (path) => {
    switch(path) {
      case '/': return 'Genel durum ve istatistikler'
      case '/vehicles': return 'Araç listesi ve yönetimi'
      case '/sold-vehicles': return 'Satılmış araçların listesi'
      case '/employees': return 'Personel yönetimi'
      case '/ex-employees': return 'Eski çalışan kayıtları'
      case '/financial-report': return 'Finansal raporlar ve analizler'
      default: return ''
    }
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
      styles={(theme) => ({
        main: {
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        },
        header: {
          background: 'linear-gradient(45deg, #4263eb 0%, #00b8d4 100%)',
          borderBottom: 'none'
        }
      })}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              color="white"
              onClick={() => setOpened(!opened)}
              display={{ sm: 'none' }}
            >
              <IconMenu2 size={18} />
            </ActionIcon>
            <Group>
              <ThemeIcon 
                size="xl" 
                radius="md" 
                variant="white"
                color="dark"
                sx={{ 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transform: 'rotate(-10deg)'
                }}
              >
                <IconCar size={24} />
              </ThemeIcon>
              <div>
                <Text weight={700} size="lg" color="white">E-Auto</Text>
                <Text size="xs" color="white" opacity={0.7}>Araç Yönetim Sistemi</Text>
              </div>
            </Group>
          </Group>
          
          <Group>
            <Text size="sm" color="white" opacity={0.7}>
              {new Date().toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar 
        p="md"
        style={{
          background: 'white',
          borderRight: '1px solid #eee'
        }}
      >
        <Stack justify="space-between" h="100%">
          <Stack>
            <Text size="xs" color="dimmed" weight={500}>ANA MENÜ</Text>
            {mainLinks.map((link) => (
              <MainLink {...link} key={link.label} />
            ))}
          </Stack>
          
          <Stack>
            <Divider />
            <UnstyledButton
              onClick={signOut}
              sx={(theme) => ({
                display: 'block',
                width: '100%',
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.red[1]}`,
                backgroundColor: theme.colors.red[0],
                color: theme.colors.red[7],
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.colors.red[1],
                  transform: 'translateY(-2px)',
                },
              })}
            >
              <Group>
                <ThemeIcon color="red" variant="light" size="lg">
                  <IconLogout size={18} />
                </ThemeIcon>
                <div>
                  <Text size="sm" weight={500}>Çıkış Yap</Text>
                  <Text size="xs" color="dimmed">Oturumu sonlandır</Text>
                </div>
              </Group>
            </UnstyledButton>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box
          p="md"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <Paper
            p="md"
            radius="lg"
            sx={(theme) => ({
              backgroundColor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            })}
          >
            {children}
          </Paper>
        </Box>
      </AppShell.Main>
    </AppShell>
  )
} 