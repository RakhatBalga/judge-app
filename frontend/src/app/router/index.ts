import { createRouter, createWebHashHistory, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@features/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: () => homeFor() },
    {
      path: '/login',
      name: 'login',
      component: () => import('@pages/login/ui/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/teams',
      name: 'teams',
      component: () => import('@pages/teams/ui/TeamsPage.vue'),
      meta: { roles: ['judge'] },
    },
    {
      path: '/score/:teamId',
      name: 'score',
      component: () => import('@pages/scoring/ui/ScoringPage.vue'),
      props: route => ({ teamId: Number(route.params.teamId) }),
      meta: { roles: ['judge'] },
    },
    {
      path: '/admin/protocol',
      name: 'admin-protocol',
      component: () => import('@pages/admin-protocol/ui/AdminProtocolPage.vue'),
      meta: { roles: ['admin'] },
    },
    {
      path: '/admin/logs',
      name: 'admin-logs',
      component: () => import('@pages/admin-logs/ui/AdminLogsPage.vue'),
      meta: { roles: ['admin'] },
    },
  ],
})

function homeFor(): { name: string } {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return { name: 'login' }
  return auth.isAdmin ? { name: 'admin-protocol' } : { name: 'teams' }
}

router.beforeEach((to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) return homeFor()
    return
  }
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }

  const allowed = (to.meta.roles as string[] | undefined) ?? []
  if (allowed.length && auth.user && !allowed.includes(auth.user.role)) {
    return homeFor()
  }
})

export default router
