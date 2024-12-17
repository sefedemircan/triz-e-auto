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
} from '@tabler/icons-react'

const mainLinks = [
  { icon: IconDashboard, color: 'blue', label: 'Genel Bakış', to: '/' },
  { icon: IconCar, color: 'teal', label: 'Araçlar', to: '/vehicles' },
  { icon: IconCarOff, color: 'grape', label: 'Satılan Araçlar', to: '/sold-vehicles' },
  { icon: IconUsers, color: 'orange', label: 'Personel', to: '/employees' },
  { icon: IconUserOff, color: 'red', label: 'Eski Personel', to: '/ex-employees' },
]

export default function Layout({ children }) {
  const [opened, setOpened] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()

  const MainLink = ({ icon: Icon, color, label, to }) => (
    <UnstyledButton
      onClick={() => {
        navigate(to)
        setOpened(false)
      }}
      style={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
        backgroundColor: location.pathname === to ? 
          theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]
          : 'transparent',
        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      })}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          <Icon size={18} />
        </ThemeIcon>
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  )

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => setOpened(!opened)}
              display={{ sm: 'none' }}
            >
              <IconMenu2 size={18} />
            </ActionIcon>
            <Group>
              <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                <IconCar size={20} />
              </ThemeIcon>
              <Text weight={700} size="lg" color="indigo">E-Auto</Text>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
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
              style={(theme) => ({
                display: 'block',
                width: '100%',
                padding: theme.spacing.xs,
                borderRadius: theme.radius.sm,
                color: theme.colors.red[6],
                '&:hover': {
                  backgroundColor:
                    theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                },
              })}
            >
              <Group>
                <ThemeIcon color="red" variant="light">
                  <IconLogout size={18} />
                </ThemeIcon>
                <Text size="sm">Çıkış Yap</Text>
              </Group>
            </UnstyledButton>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
} 