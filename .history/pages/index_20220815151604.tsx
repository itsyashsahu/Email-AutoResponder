import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useSession, signIn, signOut } from "next-auth/react"

const Home: NextPage = () => {
  const {data: session} = useSession()

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Create navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbarLinks}>
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>
        <div className={styles.signup}>
          {session && session.user ? (
            <button onClick={() => signOut()}>Sign out</button>
          ) : (
            <button onClick={() => signIn()}>Sign in</button>
          )}
        </div>
      </nav>
      <main className={styles.main}>
        <div>
          {/* create book card */}
          {session && session.user ? (
          
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <Image src="/architecture.png" alt="book" width={500} height={300} />
            </div>
            <div className={styles.cardContent}>
              <h2>Create Next App</h2>
              <p>
                This is a simple hero unit, a simple jumbotron-style component for calling
                extra attention to featured content or information.
              </p>
              <p>
                <a className={styles.btn} href="https://nextjs.org/docs" target="_blank">
                  Learn More
                </a>
              </p>
            </div>
          </div>
          ) : (
           

        </div>
      </main>
    </div>
  )
}

export default Home
