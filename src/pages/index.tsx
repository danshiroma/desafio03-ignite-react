import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
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
  const [postsState, setPostsState] = useState<PostPagination>(postsPagination);

  function handleLoadMore() {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        setPostsState(getResponseData(data));
      });
  }

  function getResponseData(data) {
    return {
      next_page: data.next_page,
      results: [
        ...postsState.results,
        {
          uid: data.results[0].uid,
          first_publication_date: data.results[0].first_publication_date,
          data: {
            title: data.results[0].data.title,
            subtitle: data.results[0].data.subtitle,
            author: data.results[0].data.author,
          },
        },
      ],
    };
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <main className={commonStyles.container}>
        <section className={styles.postsSection}>
          <img src="Logo.svg" alt="logo" />
          {postsState.results.map(post => (
            <div className={styles.singlePost} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h2>{post.data.title}</h2>
                  <h4>{post.data.subtitle}</h4>
                  <div className={commonStyles.postInfo}>
                    <FiCalendar color="#BBBBBB" />
                    <p>
                      {format(
                        parseISO(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </p>
                    <FiUser color="#BBBBBB" />
                    <p>{post.data.author}</p>
                  </div>
                </a>
              </Link>
            </div>
          ))}
          {postsState.next_page && (
            <p className={styles.loadMore} onClick={() => handleLoadMore()}>
              Carregar mais posts
            </p>
          )}
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
      first_publication_date: post.first_publication_date,
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
