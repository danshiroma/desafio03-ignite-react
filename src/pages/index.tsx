import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <main className={commonStyles.container}>
        <section className={styles.postsSection}>
          <img src="Logo.svg" alt="logo" />
          {postsPagination.results.map(post => (
            <div className={styles.singlePost}>
              <h2>{post.data.title}</h2>
              <h4>{post.data.subtitle}</h4>
              <div className={styles.postInfo}>
                <FiCalendar color="#BBBBBB" />
                <p>{post.first_publication_date}</p>
                <FiUser color="#BBBBBB" />
                <p>{post.data.author}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );
  const { next_page } = postsResponse;
  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(
        post.first_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page,
      },
    },
    revalidate: 60 * 60,
  };
};
