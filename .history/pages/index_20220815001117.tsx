import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
         <div>
          {/* create book card */}
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <Image src="/images/book.jpg" alt="book" width={200} height={300} />
              </div>
              <div className={styles.cardContent}>
         </div>
      </main>
    </div>
  )
}

export default Home
