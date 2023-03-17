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
          {/* Create  */}
          {/* create book card */}
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <Image src="/images/book.jpg" alt="book" width={200} height={300} />
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
        </div>
      </main>
    </div>
  )
}

export default Home
